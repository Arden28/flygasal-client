import React, { useState } from "react";
import logo from "/assets/img/logo/flygasal.png";
import { Link } from "react-router-dom";

export default function Footer() {
  const [newsletter, setNewsletter] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setNewsletter({ ...newsletter, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setNewsletter({ name: "", email: "" });
    }, 1500);
  };

 

  return (


  <footer className="bg-[#0E0930] text-white">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid gap-10 md:grid-cols-4">
        <div>
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <img src={logo} alt="FlyGasal" className="h-8 w-auto" />
          </Link>
        </div>
        <div>
          <h5 className="font-semibold">Book with us</h5>
          <ul style={{ color: "#fff" }} className="mt-3 space-y-2 text-white">
            <li><a href="#" className="text-white hover:text-gray-300">Search &amp; book</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Multi stop search</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold">My booking</h5>
          <ul className="mt-3 space-y-2 text-white/80">
            <li><a href="/bookings" className="text-white hover:text-gray-300">Manage my booking</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Help centre</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Contact us</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Travel advice</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-semibold">Company</h5>
          <ul className="mt-3 space-y-2 text-white/80">
            <li><a href="/about" className="text-white hover:text-gray-300">About us</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Reviews</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Blog</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Media centre</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Careers</a></li>
            <li><a href="#" className="text-white hover:text-gray-300">Modern Slavery</a></li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
  );
}