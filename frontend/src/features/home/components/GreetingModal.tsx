import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function GreetingModal({onClose}) {
    const { t } = useTranslation();
    const [dontShowAgain, setDontShowAgain] = useState(false);


    const handleClose = () =>{
        if(dontShowAgain){
            localStorage.setItem("hideWelcomeModal","true")
        }

        onClose();
    }
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
            
            <div className="p-8">
                <h3 className="text-center text-2xl font-semibold text-gray-900">
                   {t("first-modal.title")}
                </h3>
                <p className="mt-2 text-center text-gray-500">
                    {t("first-modal.content")}
                </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
                
                <label className="flex items-center space-x-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        name="reminder"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" 
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                        {t("first-modal.reminder")}
                    </span>
                </label>

                <button className={`
                    text-left
                    rounded-xl px-3 py-2
                    shadow-sm
                    active:translate-y-[1px]
                    transition
                    border
                    hover:shadow-md
                    bg-[var(--qc-bg)]
                    hover:bg-[var(--qc-hover-bg)]
                `} onClick={handleClose}>
                    {t("first-modal.close")}
                </button>
            </div>
            
        </div>
    </div>
);
}