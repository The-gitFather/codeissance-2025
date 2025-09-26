"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export function TodoList() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState("")

  const addTodo = () => {
    if (input.trim() !== "") {
      setTodos([...todos, { text: input, completed: false }])
      setInput("")
    }
  }

  const toggleTodo = (index) => {
    const newTodos = [...todos]
    newTodos[index].completed = !newTodos[index].completed
    setTodos(newTodos)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-lg h-full"
    >
      <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Todo List</h2>
      <div className="flex mb-4">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a new todo"
          className="mr-2"
        />
        <Button onClick={addTodo} className="bg-indigo-600 hover:bg-indigo-700">
          Add
        </Button>
      </div>
      <ul className="space-y-2">
        {todos.map((todo, index) => (
          <li key={index} className="flex items-center">
            <Checkbox id={`todo-${index}`} checked={todo.completed} onCheckedChange={() => toggleTodo(index)} />
            <label
              htmlFor={`todo-${index}`}
              className={`ml-2 ${todo.completed ? "line-through text-gray-500" : "text-gray-800"}`}
            >
              {todo.text}
            </label>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

