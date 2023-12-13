import { getToastStore, type ToastStore } from '@skeletonlabs/skeleton';

let toastStore: ToastStore;
export function initializeNotifications() {
	toastStore = getToastStore();
}

export function showError(message: string) {
	toastStore.clear();
	toastStore.trigger({
		message,
		background: 'variant-filled-error'
	});
}

export function showSuccess(message: string = 'Success!') {
	toastStore.clear();
	toastStore.trigger({
		message,
		background: 'variant-filled-success'
	});
}

export function showWarning(message: string) {
	toastStore.clear();
	toastStore.trigger({
		message,
		background: 'variant-filled-warning'
	});
}

export function showInfo(message: string) {
	toastStore.clear();
	toastStore.trigger({
		message,
		background: 'variant-filled-tertiary'
	});
}
