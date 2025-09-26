"use client"

import { useEffect } from "react"
import { Globe } from "lucide-react"
import type React from "react" // Added import for React

const LanguageSelect = () => {
    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        script.type = "text/javascript"
        document.body.appendChild(script)

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                },
                "google_translate_element",
            )
        }

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const languageCode = event.target.value
        const selectBox = document.querySelector(".goog-te-combo") as HTMLSelectElement
        if (selectBox) {
            selectBox.value = languageCode
            selectBox.dispatchEvent(new Event("change"))
        }
    }

    return (
        <div className="p-2 z-[100] relative flex start">
            <select
                onChange={handleLanguageChange}
                aria-label="Select language"
                className=" cursor-pointer bg-transparent border-none pr-6 pl-2 py-1 focus:outline-none"
                defaultValue="en"
            >
                <option value="en" disabled hidden>

                </option>
                <option value="en">English</option>
                <option value="mr">Marathi</option>
                <option value="hi">Hindi</option>
                <option value="pa">Punjabi</option>
                <option value="ta">Tamil</option>
            </select>
            <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none h-6 w-6" size={18} />
            <div id="google_translate_element" style={{ display: "none" }}></div>
        </div>
    )
}

export default LanguageSelect
