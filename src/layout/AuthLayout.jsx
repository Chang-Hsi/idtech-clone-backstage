import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout
