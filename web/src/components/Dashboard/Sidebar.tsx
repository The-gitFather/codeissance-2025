import { Home, Calendar, CheckSquare, Clock, BookOpen, User } from "lucide-react"

export function Sidebar() {
  return (
    <div className="bg-indigo-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
      <nav>
        <a href="#" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 hover:text-white">
          <Home className="inline-block mr-2" size={20} />
          Dashboard
        </a>
        <a href="#" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 hover:text-white">
          <Calendar className="inline-block mr-2" size={20} />
          Calendar
        </a>
        <a href="#" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 hover:text-white">
          <CheckSquare className="inline-block mr-2" size={20} />
          Tasks
        </a>
        <a href="#" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 hover:text-white">
          <Clock className="inline-block mr-2" size={20} />
          Timetable
        </a>
        <a href="#" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 hover:text-white">
          <BookOpen className="inline-block mr-2" size={20} />
          Courses
        </a>
        <a href="#" className="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700 hover:text-white">
          <User className="inline-block mr-2" size={20} />
          Profile
        </a>
      </nav>
    </div>
  )
}

