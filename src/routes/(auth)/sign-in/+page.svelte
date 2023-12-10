<script lang="ts">
	import { signInWithEmailAndPassword, type AuthError } from 'firebase/auth';
	import { goto } from '$app/navigation';
	import { getToastStore } from '@skeletonlabs/skeleton';
	import { auth } from '$lib/firebase';
	import { showError, showSuccess } from '$lib/util/notif';

	type Field = {
		error?: string;
		value: string;
	};

	type Form = {
		email: Field;
		password: Field;
	};

	let form: Form = {
		email: { value: '' },
		password: { value: '' }
	};

	async function onSubmit(event: SubmitEvent) {
		if (form.password.value.length < 8) {
			form.password.error = 'Password is too short';
			showError('Password is too short');
			return;
		}

		try {
			await signInWithEmailAndPassword(auth, form.email.value, form.password.value);
			showSuccess('Sign in successful!');
			goto('/', { invalidateAll: true });
		} catch (err: any) {
			const error: AuthError = err;
			let message: string;
			switch (error.code) {
				case 'auth/wrong-password':
					message = 'Your email/password is incorrect';
					break;
				default:
					message = `Error: ${err}`;
			}

			showError(message);
		}
	}
</script>

<form on:submit|preventDefault={onSubmit} method="POST" class="card p-4 w-96">
	<header class="card-header p-0">
		<h2 class="h2">Sign in</h2>
		<p class="text-sm">Sign in with email and password</p>
	</header>
	<section class="my-4">
		<label class="label">
			<span>Email</span>
			<input
				name="email"
				type="email"
				bind:value={form.email.value}
				placeholder="Enter your email"
				required
				class="input p-2"
				class:input-error={form.email.error}
			/>
		</label>
		<label class="label">
			<span>Password</span>
			<input
				name="password"
				type="password"
				bind:value={form.password.value}
				placeholder="Enter your password"
				required
				class="input p-2"
				class:input-error={form.password.error}
			/>
		</label>
		<div class="flex justify-between items-center my-4">
			<a href="/reset-password" class="anchor">Reset password</a>
			<button class="btn variant-filled-primary">Submit</button>
		</div>
	</section>
	<footer class="card-footer text-center p-0">
		<a href={'/sign-up'} class="anchor">Sign up</a>
	</footer>
</form>
