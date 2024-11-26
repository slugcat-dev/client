import { base64ToFile } from './utils'

const apiURL = import.meta.env.APP_API_URL

/**
 * Upload a file to the server
 */
export function uploadFile(file: File | Base64File, onProgress?: (progress: number) => void) {
	const data = new FormData()
	const xhr = new XMLHttpRequest()

	if (file instanceof File)
		data.append('file', file)
	else
		data.append('file', base64ToFile(file.base64, file.name, file.type))

	xhr.upload.addEventListener('progress', (event: ProgressEvent) => {
		if (onProgress && event.lengthComputable)
			onProgress((event.loaded / event.total) * 100)
	})

	return new Promise<any>((resolve, reject) => {
		xhr.addEventListener('load', () => {
			if (xhr.status !== 200)
				reject(new Error('Upload failed'))

			resolve(JSON.parse(xhr.responseText))
		})
		xhr.addEventListener('error', () => reject(new Error('Upload failed')))
		xhr.open('POST', `${apiURL}/upload`)
		xhr.send(data)
	})
}
