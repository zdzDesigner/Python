import { LoadingOutlined } from '@ant-design/icons'

export const TPLLoading = () => {
  return (
    <div className="flex justify-center items-center h-20">
      <LoadingOutlined />
      {
        // <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      }
    </div>
  )
}
