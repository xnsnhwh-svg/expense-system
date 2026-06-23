import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'motion/react'
import { Menu, X, CreditCard, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV_LINKS = ['概览', '方案', '案例', '联系']

function StaggeredFade({ text }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const chars = text.split('')

  return (
    <span ref={ref} className="inline-block">
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: i * 0.07 }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  )
}

const menuVariants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
}

const itemVariants = {
  hidden: { opacity: 0, y: -8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.05 + i * 0.06, ease: 'easeOut' },
  }),
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      style={{ backgroundColor: '#010101' }}
      className="relative w-full h-screen overflow-hidden font-['Geist',-apple-system,BlinkMacSystemFont,sans-serif]"
    >
      {/* ── Video Background ── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260619_191346_9d19d66e-86a4-47f7-8dc6-712c1788c3b2.mp4"
          type="video/mp4"
        />
      </video>

      {/* ── Overlay ── */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className="relative z-20 flex items-center justify-between md:justify-center px-6 py-6 md:px-12 md:py-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white/80" />
          </div>
          <span className="text-white font-light uppercase tracking-[0.25em] md:tracking-[0.3em] text-[13px]">
            FinFlow
          </span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10 ml-16">
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-white/80 uppercase tracking-[0.2em] text-[13px] font-light hover:text-white transition-colors duration-300"
            >
              {link}
            </a>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white/80 hover:text-white transition-colors"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed top-16 left-4 right-4 z-50 md:hidden mobile-menu-glass rounded-2xl py-8 flex flex-col items-center gap-5"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link}
                href="#"
                custom={i}
                variants={itemVariants}
                initial="hidden"
                animate="show"
                className="text-white/90 tracking-[0.25em] uppercase font-light text-[14px] hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-5 sm:px-8 pt-12 sm:pt-16 md:pt-24">
        {/* Heading */}
        <h1 className="font-garamond text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-normal text-white leading-[1.08] tracking-tight mb-6 sm:mb-8">
          <StaggeredFade text="智能驱动" />
          <br />
          <StaggeredFade text="财务无忧" />
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="text-white/70 font-light leading-relaxed max-w-xs sm:max-w-md text-sm sm:text-base md:text-lg mb-8 sm:mb-10"
        >
          AI 驱动的多 Agent 报销审批平台
          <span className="hidden sm:inline"><br /></span>
          让企业财务流程更高效、更透明
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.0 }}
        >
          <Link
            to="/login"
            className="liquid-glass inline-flex items-center gap-3 rounded-full px-7 sm:px-10 py-3.5 sm:py-4 text-white/90 uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[13px] sm:text-[14px] font-light hover:text-white transition-colors duration-300"
          >
            进入系统
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
