import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import AppLayout from './layouts/AppLayout'

const Home = lazy(() => import('./pages/Home'))
const CareerRecommendation = lazy(() => import('./pages/CareerRecommendation'))
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'))
const AIGuideChat = lazy(() => import('./pages/AIGuideChat'))
const SkillAssessment = lazy(() => import('./pages/SkillAssessment'))
const JobSearch = lazy(() => import('./pages/JobSearch'))
const About = lazy(() => import('./pages/About'))

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/recommendation" element={<CareerRecommendation />} />
          <Route path="/resume-builder" element={<ResumeBuilder />} />
          <Route path="/ai-guide" element={<AIGuideChat />} />
          <Route path="/skill-assessment" element={<SkillAssessment />} />
          <Route path="/job-search" element={<JobSearch />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
