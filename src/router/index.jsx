import { Navigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Chinese from '@/pages/Chinese'
import ChineseWriting from '@/pages/ChineseWriting'
import ChineseReading from '@/pages/ChineseReading'
import VocabLayout from '@/pages/vocab/VocabLayout'
import VocabHome from '@/pages/vocab/VocabHome'
import DictationSession from '@/pages/vocab/DictationSession'
import DictationResult from '@/pages/vocab/DictationResult'
import WrongWords from '@/pages/vocab/WrongWords'
import WordBooks from '@/pages/vocab/WordBooks'
import WordBookEdit from '@/pages/vocab/WordBookEdit'
import MathPage from '@/pages/Math'
import English from '@/pages/English'
import Science from '@/pages/Science'

export const SUBJECT_NAV = [
  { key: 'chinese', label: '语文', path: '/chinese/writing', icon: '📖' },
  { key: 'math', label: '数学', path: '/math', icon: '🔢' },
  { key: 'english', label: '英语', path: '/english', icon: '🔤' },
  { key: 'science', label: '科学', path: '/science', icon: '🔬' },
]

export const CHINESE_MODULES = [
  { key: 'writing', label: '写作引导', path: '/chinese/writing', ready: true },
  { key: 'vocab', label: '生词听写', path: '/chinese/vocab', ready: true },
  { key: 'reading', label: '阅读理解', path: '/chinese/reading', ready: true },
]

export const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/chinese/writing" replace /> },
      {
        path: 'chinese',
        element: <Chinese />,
        children: [
          { index: true, element: <Navigate to="writing" replace /> },
          { path: 'writing', element: <ChineseWriting /> },
          { path: 'reading', element: <ChineseReading /> },
          {
            path: 'vocab',
            element: <VocabLayout />,
            children: [
              { index: true, element: <VocabHome /> },
              { path: 'dictation', element: <DictationSession /> },
              { path: 'result', element: <DictationResult /> },
              { path: 'wrong', element: <WrongWords /> },
              { path: 'books', element: <WordBooks /> },
              { path: 'books/:id', element: <WordBookEdit /> },
            ],
          },
        ],
      },
      { path: 'math', element: <MathPage /> },
      { path: 'english', element: <English /> },
      { path: 'science', element: <Science /> },
    ],
  },
]
