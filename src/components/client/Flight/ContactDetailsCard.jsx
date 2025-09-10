import { motion } from "framer-motion";
// If you're using lucide or another icon set, you can swap the inline SVGs.

export default function ContactDetailsCard({
  formData,
  handleFormChange
}) {

  return (
    <motion.div
      className="bg-white rounded-2xl w-full max-w-3xl mb-3 overflow-hidden ring-1 ring-slate-200"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3">
            {/* Left: Icon + Title */}
            <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-slate-300">
                {/* Minimal airplane mark */}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 640 640"
                    aria-hidden
                >
                    <path d="M224.2 89C216.3 70.1 195.7 60.1 176.1 65.4L170.6 66.9C106 84.5 50.8 147.1 66.9 223.3C104 398.3 241.7 536 416.7 573.1C493 589.3 555.5 534 573.1 469.4L574.6 463.9C580 444.2 569.9 423.6 551.1 415.8L453.8 375.3C437.3 368.4 418.2 373.2 406.8 387.1L368.2 434.3C297.9 399.4 241.3 341 208.8 269.3L253 233.3C266.9 222 271.6 202.9 264.8 186.3L224.2 89z"/>
                </svg>
                </div>
                <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900">Contact details</h2>
                <p className="text-xs text-slate-600">This is where we'll send your tickets and booking updates</p>
                </div>
            </div>
        </header>

        <div className="divide-y divide-slate-200 pb-4">
            <section className="bg-white">
                <div className="px-4 py-2 sm:px-6">
                <form className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Full Name */}
                    <div className="relative col-span-1 lg:col-span-2">
                    <input
                        type="text"
                        name="full_name"
                        id="full_name"
                        value={formData.full_name}
                        onChange={handleFormChange}
                        placeholder=""
                        className="peer block w-full border border-slate-300 rounded-2xl px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-sky-500 focus:outline-none"
                    />
                    <label
                        htmlFor="full_name"
                        className="absolute left-3 top-2 text-slate-500 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-xs peer-focus:top-2  peer-focus:text-xs"
                    >
                        Full name
                    </label>
                    </div>

                    {/* Email */}
                    <div className="relative">
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder=" "
                        className="peer block w-full border border-slate-300 rounded-2xl px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-sky-500 focus:outline-none"
                    />
                    <label
                        htmlFor="email"
                        className="absolute left-3 top-2 text-slate-500 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-xs peer-focus:top-2  peer-focus:text-xs"
                    >
                        Email address
                    </label>
                    </div>

                    {/* Phone */}
                    <div className="relative">
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleFormChange}
                        placeholder=" "
                        className="peer block w-full border border-slate-300 rounded-2xl px-3 pt-4 pb-2 text-sm text-slate-900 placeholder-transparent focus:border-sky-500 focus:outline-none"
                    />
                    <label
                        htmlFor="phone"
                        className="absolute left-3 top-2 text-slate-500 text-xs transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-placeholder-shown:text-xs peer-focus:top-2  peer-focus:text-xs"
                    >
                        Phone number
                    </label>
                    </div>
                </form>
                </div>
            </section>

        </div>


    </motion.div>
  );
}

