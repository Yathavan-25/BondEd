import Link from 'next/link'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ChartNoAxesCombined, GraduationCap, Sparkles, Users } from 'lucide-react'
import Image from 'next/image'

const page = () => {

    const subContent = [
        {icon : Sparkles , text : "Access your personalized dashboard"},
        {icon : Users , text : "Connect with your matches"},
        {icon : ChartNoAxesCombined , text : "Review your study sessions"}
    ]

    const formContent = [
        {
            id : "email",
            text : "Email",
            placeholder : "name@example.com",
            type : "email"
        },
        {
            id : "password",
            text : "Password",
            placeholder : "Create a strong password",
            type : "password"
        }
    ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen lg:mx-20 mx-4 my-28">
        {/* Full Background Gradient Container */}
        <section className="relative w-full bg-primary-linear rounded-[2.5rem] flex flex-col lg:flex-row overflow-hidden shadow-2xl">
          

          {/* ======================================================== */}
          {/* LEFT SIDE - BRANDING & HERO                              */}
          {/* ======================================================== */}
          <div className="relative z-10 flex-1 flex flex-col justify-center p-10 lg:p-20 text-white">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 w-fit relative lg:-top-10 lg:-left-10 -left-5 -top-5">
              <div className="lg:siz-10 size-7 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-sm">
                <GraduationCap className="lg:size-5 size-4 text-white" />
              </div>
              <span className="lg:text-2xl font-bold tracking-tight">BondEd</span>
            </Link>

            {/* Content Centered Vertically */}
            <div className="flex flex-col items-center">
              <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-center mb-4 leading-[1.1]">
              Welcome back, Continue  <br />  your learning journey.
              </h1>
              <p className="text-lg text-white/60 max-w-md leading-relaxed font-medium font-geist mb-10 text-center">
              Pick up where you left off. Review pending requests, jump into scheduled sessions, and track your weekly progress.
              </p>

              <div className="flex flex-col gap-4 mt-10 mb-23">

                {subContent.map((item,key) => (
                    <div className='flex items-center gap-2 w-fit font-geist' key={key}>
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex  items-center justify-center backdrop-blur-md border border-white/20 shadow-sm">
                            <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[16px] font-light tracking-tight">
                            {item.text}
                        </span>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDE - GLASSMORPHISM FORM                          */}
          {/* ======================================================== */}
          <div className="relative z-10 w-full lg:w-125 flex items-center ">
            
            {/* The Glass Card with exact user margins */}
            <div className="w-full lg:mr-10.25 lg:my-8.75 m-6 p-8 sm:p-10 bg-white/35 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] flex flex-col text-white">
              
              {/* Form Headers */}
              <div className="flex flex-col mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight mb-2">
                  Welcome Back
                </h2>
                <p className="text-sm font-geist">
                  Glad to have you back 😊
                </p>
              </div>

              <div className="flex flex-col gap-6 font-geist">
                
                {/* Glassy Google SSO Button */}
                <button 
                  type="button" 
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-line-linear bg-white/5 px-4 py-3.5 text-sm font-regular transition-all hover:bg-white/10 hover:border-white/30 shadow-sm active:scale-[0.98] text-black"
                >
                <Image src="/icons/google.svg" width={24} height={24} alt='Google Icon' />
                  Sign In with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/20"></div>
                  <span className="text-xs font-medium uppercase text-white/50 tracking-wider">Or continue with</span>
                  <div className="h-px flex-1 bg-white/20"></div>
                </div>

                {/* Glassy Registration Form */}


                <form className="grid grid-cols-2 gap-4">
                    {formContent.map((item, key) => {
                        // Check if the item should be half-width or full-width
                        const isHalfWidth = item.id === "firstName" || item.id === "lastName";

                        return (
                            <div 
                                key={key} 
                                className={`flex flex-col gap-1.5 ${isHalfWidth ? "col-span-1" : "col-span-2"}`}
                            >
                                <label htmlFor={item.id} className="text-sm font-medium text-white/90">
                                    {item.text}
                                </label>
                                <input 
                                    type={item.type}  
                                    id={item.id} 
                                    placeholder={item.placeholder} 
                                    className="h-11 w-full rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-white outline-none transition-all placeholder:text-white/60 focus:placeholder:text-white focus:border-white/50 focus:bg-white/20 focus:ring-4 focus:ring-white/10"
                                />
                            </div>
                        );
                    })}
                    
                </form>
                    <div className='font-geist flex justify-between'>
                        <div className='flex gap-2 items-center'>
                            <input type="checkbox" id="remember" className='size-3.5 justify-center'/>
                            <label htmlFor="remember" className='text-sm font-medium text-white/90'>Remember Me</label>
                        </div>
                        <span className='text-sm font-medium text-primary/70 transition-colors hover:text-white cursor-pointer'>Forgot Password ?</span>
                    </div>
                    {/* Your Submit Button goes here, using col-span-2 to stretch across the bottom */}
                    <button type='submit' className="group border-2 bg-primary-linear px-6 py-2 text-white hover:bg-white hover:border-primary-linear transition-all">
                        <span className="group-hover:text-primary-linear group-hover:font-bold">Create Account</span>
                    </button>
                   

                  

              </div>

              {/* Footer Login Link */}
              <p className="mt-8 text-center text-sm text-white/70 font-geist">
                Don&apos;t have an account ?{" "}
                <Link href="/Register" className="font-semibold text-primary hover:text-white/80 transition-colors">
                  Sign Up
                </Link>
              </p>

            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  )
}

export default page