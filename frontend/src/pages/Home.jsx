import Hero from '../components/Hero'
import AssessmentModules from '../components/AssessmentModules'
import HowItWorks from '../components/HowItWorks'
import WhyOA from '../components/WhyOA'
import GuestCTA from '../components/GuestCTA'
import FinalCTA from '../components/FinalCTA'
import MedicalDisclaimer from '../components/MedicalDisclaimer'

export default function Home() {
  return (
    <>
      <Hero />
      <AssessmentModules />
      <HowItWorks />
      <WhyOA />
      <GuestCTA />
      <FinalCTA />
      <MedicalDisclaimer />
    </>
  )
}
