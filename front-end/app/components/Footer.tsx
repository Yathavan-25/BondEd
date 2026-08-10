'use client'

import { motion, Variants } from "framer-motion"
import { GraduationCap } from "lucide-react"
import Link from "next/link"
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import GitHubIcon from '@mui/icons-material/GitHub';

const footerLinks = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/#features" },
      { name: "Pricing", href: "/#pricing" },
      { name: "Success Stories", href: "/#stories" },
      { name: "How It Works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About Us", href: "/About" },
      { name: "FAQs", href: "/Faqs" },
      { name: "Blogs", href: "/Blogs" },
      { name: "Contact", href: "/Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Help Center", href: "/Help" },
      { name: "Guide", href: "/Guide" },
      { name: "Community", href: "/Community" },
      { name: "Api Docs", href: "/ApiDocs" },
    ],
  },
]

const socialLinks = [
  { icon: XIcon, href: "#" },
  { icon: InstagramIcon, href: "#" },
  { icon: LinkedInIcon, href: "#" },
  { icon: GitHubIcon, href: "#" },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const
    }
  }
}

export default function Footer() {
  return (
    <footer className="relative w-full bg-[#052247] text-white overflow-hidden pt-20 sm:pt-24 isolate">

      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col">

        {/* --- Top/Middle Section: Logo & Links --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16 md:mb-24 relative z-10"
        >
          {/* Logo & Description Column */}
          <motion.div variants={itemVariants} className="lg:col-span-3 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary-linear flex items-center justify-center">
                <GraduationCap className="size-5 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">BondEd</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-8 font-geist">
              Empowering students to learn smarter, together. The AI-powered collaborative platform built for modern academic success.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon
                return (
                  <Link
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 transition-all duration-300 hover:bg-white/10 hover:text-white hover:-translate-y-1 transform-gpu"
                  >
                    <Icon className="w-4 h-4" />
                  </Link>
                )
              })}
            </div>
          </motion.div>

          {/* Links Columns */}
          {footerLinks.map((section, index) => (
            <motion.div variants={itemVariants} key={index} className="flex flex-col">
              <h4 className="text-white font-semibold mb-6">{section.title}</h4>
              <ul className="flex flex-col gap-4 ">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link
                      href={link.href}
                      className="text-gray-400 text-sm transition-colors duration-300 hover:text-white flex items-center group relative w-fit font-geist"
                    >
                      {link.name}
                      <span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* --- Bottom Section: Legal & Copyright --- */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col font-geist sm:flex-row items-center justify-between py-6 border-t border-white/10 relative z-10"
        >
          <p className="text-gray-500 text-sm mb-4 sm:mb-0">
            &copy; {new Date().getFullYear()} BondEd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/Privacy" className="text-gray-500 text-sm hover:text-white transition-colors duration-300">Privacy Policy</Link>
            <Link href="/Terms" className="text-gray-500 text-sm hover:text-white transition-colors duration-300">Terms of Service</Link>
          </div>
        </motion.div>
      </div>



    </footer>
  )
}