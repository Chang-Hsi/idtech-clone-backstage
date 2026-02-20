import { Outlet } from 'react-router-dom'

const AppMainWorkspace = ({ hasSecondarySidebar }) => {
  return (
    <main
      className={`min-h-screen flex-1 overflow-x-hidden bg-[#F6F7FB] ${hasSecondarySidebar ? 'ml-18 md:ml-0' : 'ml-18'}`}
    >
      <div className="h-full p-6 md:p-8">
        <Outlet />
      </div>
    </main>
  )
}

export default AppMainWorkspace
