import { useStorage } from './composables/storage'
import { base64ToFile, logBadge } from './utils'

const apiURL = import.meta.env.APP_API_URL
const storage = await useStorage()

/**
 * Upload a file to the server.
 */
export function uploadFile(file: File | Base64File, onProgress?: (progress: number) => void) {
	console.log('%cUPLOAD', logBadge('#7ee787'), file.name)

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
		xhr.setRequestHeader('Authorization', `Bearer ${storage.token}`)
		xhr.send(data)
	})
}
