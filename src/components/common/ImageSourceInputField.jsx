import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import FormField from './FormField'

const ImageSourceInputField = ({
  label = 'Image URL',
  mode = 'url',
  onModeChange,
  urlValue = '',
  onUrlChange,
  onUrlBlur,
  urlError = '',
  urlPlaceholder = 'https://...',
  uploadFile = null,
  onUploadFileChange,
  onClearUploadFile,
  uploadError = '',
  className = '',
  required = false,
}) => (
  <FormField
    label={mode === 'url' ? label : 'Upload Image'}
    className={className}
    required={required}
    error={mode === 'url' ? urlError : uploadError}
  >
    <div className="space-y-2">
      <div className="inline-flex rounded-md border border-slate-300 p-1">
        <button
          type="button"
          onClick={() => onModeChange('url')}
          className={`rounded px-3 py-1 text-xs font-medium transition ${
            mode === 'url' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Image URL
        </button>
        <button
          type="button"
          onClick={() => onModeChange('upload')}
          className={`rounded px-3 py-1 text-xs font-medium transition ${
            mode === 'upload' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Upload Image
        </button>
      </div>

      {mode === 'url' ? (
        <input
          value={urlValue}
          onChange={(event) => onUrlChange(event.target.value)}
          onBlur={onUrlBlur}
          placeholder={urlPlaceholder}
          className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-indigo-500"
        />
      ) : (
        <div className="rounded-md border border-dashed border-indigo-300 bg-indigo-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-indigo-500 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <ArrowUpTrayIcon className="h-3.5 w-3.5" />
              Choose File
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  onUploadFileChange(file)
                  event.target.value = ''
                }}
              />
            </label>
            {uploadFile ? (
              <button
                type="button"
                onClick={onClearUploadFile}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white"
              >
                Clear
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {uploadFile ? `Selected: ${uploadFile.name}` : 'No file selected. Upload happens on save.'}
          </p>
        </div>
      )}
    </div>
  </FormField>
)

export default ImageSourceInputField
