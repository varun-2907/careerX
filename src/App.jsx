import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import CareerRecommendation from './pages/CareerRecommendation'
import ResumeBuilder from './pages/ResumeBuilder'
import AIGuideChat from './pages/AIGuideChat'
import SkillAssessment from './pages/SkillAssessment'
import JobSearch from './pages/JobSearch'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/recommendation" element={<CareerRecommendation />} />
        <Route path="/resume-builder" element={<ResumeBuilder />} />
        <Route path="/ai-guide" element={<AIGuideChat />} />
        <Route path="/skill-assessment" element={<SkillAssessment />} />
        <Route path="/job-search" element={<JobSearch />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
