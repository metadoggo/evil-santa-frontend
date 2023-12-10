import { PUBLIC_API_URL } from '$env/static/public';
import { auth } from '$lib/firebase';
import { writable, type StartStopNotifier, type Writable, derived } from 'svelte/store';

export type ID = number | string;
export type Identifiable<T = ID> = {
	id: T;
};
export type Nameable = {
	name: string;
};

export type Schedulable = {
	createdAt: Date;
	updatedAt?: Date;
};

export type AsyncResult = {
	ok: boolean;
	status: number;
	id?: ID;
	message?: string;
};

export type Query = string | string[][] | Record<string, string> | URLSearchParams | undefined;
export type Data<T extends ID> = Identifiable<T> & Record<string, any>;
export type CreateResponse<T extends ID> = Identifiable<T> &
	Record<string, any> & {
		created_at: string;
	};
export type UpdateResponse = Record<string, any> & {
	updated_at: string;
};
export type ItemBuilder<T extends Identifiable<S>, S extends ID> = (raw: CreateResponse<S>) => T;
export type ItemUpdater<T extends Identifiable<S>, S extends ID> = (
	store: Writable<Record<S, T>>,
	id: S,
	data: Record<string, any>
) => void;
export type AsyncStore<T extends Identifiable<S>, S extends ID> = Record<S, T>;

export interface FetchStore<T extends Identifiable<S>, S extends ID>
	extends Writable<Record<S, T>> {
	fetchOne(id: S): Promise<void>;
	fetchAll(path?: string, query?: Query): Promise<void>;
	insert(items: CreateResponse<S>[]): void;
	insert(item: CreateResponse<S>): void;
	create(data: Record<string, any>): Promise<AsyncResult>;
	put(id: S, addQuery?: Query, body?: Record<string, any>): Promise<AsyncResult>;
	patch(id: S, addQuery?: Query, body?: Record<string, any>): Promise<AsyncResult>;
	delete(id: S): Promise<void>;
}

function createStore<T extends Identifiable<S>, S extends ID>(
	base: string,
	query?: Query,
	itemBuilder: ItemBuilder<T, S> = defaultBuilder,
	itemUpdater: ItemUpdater<T, S> = defaultUpdater,
	start?: StartStopNotifier<Record<S, T>> | undefined
): FetchStore<T, S> {
	const store = writable<Record<S, T>>({} as Record<S, T>, start);
	function makeQueryString(addQuery?: Query): string {
		let q = new URLSearchParams(query);
		if (addQuery) {
			const aq = new URLSearchParams(addQuery);
			aq.forEach((v, k) => {
				q.append(k, v);
			});
		}
		let qq = q.toString();
		if (qq.length) {
			qq = '?' + qq;
		}
		return qq;
	}

	function insertAllRaw(items: CreateResponse<S>[]) {
		store.update((s) => {
			for (const data of items) {
				const item = itemBuilder(data);
				s[item.id] = item;
			}
			return s;
		});
	}

	function insertRaw(item: CreateResponse<S>) {
		store.update((s) => {
			s[item.id] = itemBuilder(item);
			return s;
		});
	}

	async function update(
		id: S,
		addQuery?: Query,
		body?: Record<string, any>,
		method: 'POST' | 'PATCH' | 'PUT' = 'PATCH'
	) {
		const init: RequestInit = { method };
		if (body) {
			init.body = JSON.stringify(body);
			init.headers = {
				'Content-Type': 'application/json'
			};
		}
		const res = await doFetch(`${PUBLIC_API_URL}/${base}/${id}${makeQueryString(addQuery)}`, init);
		if (res.ok) {
			const data = await res.json<UpdateResponse>();
			itemUpdater(store, id, data);
			return {
				ok: res.ok,
				status: res.status,
				id
			};
		}
		return {
			ok: res.ok,
			status: res.status,
			id,
			message: await res.text()
		};
	}

	return {
		...store,
		fetchOne: async function (id: S): Promise<void> {
			const res = await doFetch(
				`${PUBLIC_API_URL}/${base}${id ? '/' + id : ''}${makeQueryString()}`
			);
			if (res.ok) {
				insertRaw(await res.json());
			} else {
				throw Error(`Fetch error: ${res.status} - ${await res.text()}`);
			}
		},
		fetchAll: async function (path?: string, addQuery?: Query): Promise<void> {
			const p = path ? `${base}/${path}` : base;
			const res = await doFetch(`${PUBLIC_API_URL}/${p}${makeQueryString(addQuery)}`);
			if (res.ok) {
				insertAllRaw(await res.json<CreateResponse<S>[]>());
			} else {
				throw Error(`Fetch error: ${res.status} - ${await res.text()}`);
			}
		},
		insert: function (data: CreateResponse<S> | CreateResponse<S>[]) {
			if (Array.isArray(data)) {
				insertAllRaw(data);
			} else {
				this.insert(data);
			}
		},
		create: async function (body: Record<string, any>, id?: S) {
			const res = await doFetch(`${PUBLIC_API_URL}/${base}${id ? '/' + id : ''}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});
			if (res.ok) {
				const data = await res.json<CreateResponse<S>>();
				store.update((s) => {
					s[data.id] = itemBuilder({ ...body, ...data });
					return s;
				});
				return {
					ok: res.ok,
					status: res.status,
					id: data.id
				};
			}
			return {
				ok: res.ok,
				status: res.status,
				message: await res.text(),
				id
			};
		},
		patch: (id: S, addQuery?: Query, body?: Record<string, any>) =>
			update(id, addQuery, body, 'PATCH'),
		put: (id: S, addQuery?: Query, body?: Record<string, any>) => update(id, addQuery, body, 'PUT'),
		// fetch: (
		// 	id: S,
		// 	addQuery?: Query,
		// 	body?: Record<string, any>,
		// 	method: 'POST' | 'PATCH' | 'PUT' = 'PATCH'
		// ) => update(id, addQuery, body, method),
		delete: async function (id: S): Promise<void> {
			const res = await doFetch(`${PUBLIC_API_URL}/${base}${id}${makeQueryString()}`, {
				method: 'DELETE'
			});
			if (res.ok) {
				store.update((s) => {
					delete s[id];
					return s;
				});
			} else {
				throw Error(`Fetch error: ${res.status} - ${await res.text()}`);
			}
		}
	};
}

export async function doFetch(path: string, init: RequestInit = {}): Promise<Response> {
	if (!auth.currentUser) {
		await auth.authStateReady();
	}

	const headers = new Headers(init.headers);
	if (auth.currentUser) {
		headers.set('Authorization', `Bearer ${await auth.currentUser.getIdToken()}`);
	}
	init.headers = headers;
	return fetch(path, init);
}

const stores: Record<string, FetchStore<any, ID>> = {};
export function useStore<T extends Identifiable<S>, S extends ID>(
	base: string,
	query?: Query,
	itemBuilder: ItemBuilder<T, S> = defaultBuilder,
	itemUpdater: ItemUpdater<T, S> = defaultUpdater,
	start?: StartStopNotifier<Record<S, T>> | undefined
): FetchStore<T, S> {
	let s = stores[base];
	if (!s) {
		s = createStore<T, S>(base, query, itemBuilder, itemUpdater, start);
		stores[base] = s;
	}
	return s;
}

export function derivedById<T extends Identifiable<S>, S extends ID>(
	store: Writable<Record<S, T>>,
	id: S
) {
	return derived(store, ($store) => {
		return $store[id];
	});
}

function defaultBuilder<T extends Identifiable<S>, S extends ID>(data: Data<S>): T {
	return {
		...data,
		id: data.id
	} as T;
}

function defaultUpdater<T extends Identifiable<S>, S extends ID>(
	store: Writable<Record<S, T>>,
	id: S,
	data: Record<string, any>
) {
	store.update((s) => {
		const item = s[id];
		s[id] = {
			...s[id],
			...data,
			id
		};
		return s;
	});
}

export function sortByName(a: Nameable, b: Nameable) {
	const na = a.name.toLowerCase();
	const nb = b.name.toLowerCase();
	if (na < nb) {
		return -1;
	}
	if (na > nb) {
		return 1;
	}
	return 0;
}

export const sortByCreatedAt = (a: Schedulable, b: Schedulable) =>
	b.createdAt.getTime() - a.createdAt.getTime();
