import { dev } from "$app/environment";

export async function uploadFile(bucket: R2Bucket, path: string, file: File, name: string) {
	let ext: string = '';
	switch (file.type) {
		case 'image/jpeg':
			ext = 'jpeg';
			break;
		case 'image/png':
			ext = 'png';
			break;
		case 'image/webp':
			ext = 'webp';
			break;
		default:
			const i = file.name.lastIndexOf('.');
			if (i > 0) {
				ext = file.name.substring(i);
			}
	}

	const filename = `${name}.${ext}`;
	const res = await bucket.put(`${path}/${filename}`, file, {
		httpMetadata: {
			contentType: file.type,
		},
		customMetadata: {
			name: file.name,
		},
	});
	if (!dev && !res) {
		console.log('up res:', res);
		return;
	}
	return filename;
}
