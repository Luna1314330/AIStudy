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
import MathHome from '@/pages/math/MathHome'
import MathWrongBook from '@/pages/math/MathWrongBook'
import MathProjectPlaceholder from '@/pages/math/MathProjectPlaceholder'
import MixedHome from '@/pages/math/mixed/MixedHome'
import MixedPlay from '@/pages/math/mixed/MixedPlay'
import SpeedArenaHome from '@/pages/math/speed/SpeedArenaHome'
import SpeedBlitz60 from '@/pages/math/speed/SpeedBlitz60'
import SpeedDefend from '@/pages/math/speed/SpeedDefend'
import TwentyFourHome from '@/pages/math/twentyfour/TwentyFourHome'
import TwentyFourPlay from '@/pages/math/twentyfour/TwentyFourPlay'
import SudokuHome from '@/pages/math/sudoku/SudokuHome'
import SudokuPlay from '@/pages/math/sudoku/SudokuPlay'
import SpatialHome from '@/pages/math/spatial/SpatialHome'
import SpatialPlay from '@/pages/math/spatial/SpatialPlay'
import English from '@/pages/English'
import EnglishHome from '@/pages/english/EnglishHome'
import GardenHome from '@/pages/english/garden/GardenHome'
import GardenInProgress from '@/pages/english/garden/GardenInProgress'
import GardenShrine from '@/pages/english/garden/GardenShrine'
import GardenPeriodicTest from '@/pages/english/garden/GardenPeriodicTest'
import GardenCompletedEdit from '@/pages/english/garden/GardenCompletedEdit'
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
      {
        path: 'math',
        element: <MathPage />,
        children: [
          { index: true, element: <MathHome /> },
          { path: 'speed', element: <SpeedArenaHome /> },
          { path: 'speed/blitz', element: <SpeedBlitz60 /> },
          { path: 'speed/defend', element: <SpeedDefend /> },
          { path: 'sudoku', element: <SudokuHome /> },
          { path: 'sudoku/play', element: <SudokuPlay /> },
          { path: 'twentyfour', element: <TwentyFourHome /> },
          { path: 'twentyfour/play', element: <TwentyFourPlay /> },
          { path: 'mixed', element: <MixedHome /> },
          { path: 'mixed/play', element: <MixedPlay /> },
          { path: 'spatial', element: <SpatialHome /> },
          { path: 'spatial/play', element: <SpatialPlay /> },
          { path: 'boss/1', element: <MathProjectPlaceholder projectId="boss-1" /> },
          { path: 'boss/2', element: <MathProjectPlaceholder projectId="boss-2" /> },
          { path: 'wrong', element: <MathWrongBook /> },
        ],
      },
      {
        path: 'english',
        element: <English />,
        children: [
          { index: true, element: <EnglishHome /> },
          { path: 'garden', element: <GardenHome /> },
          { path: 'garden/in-progress', element: <GardenInProgress /> },
          { path: 'garden/completed-edit', element: <GardenCompletedEdit /> },
          { path: 'garden/periodic-test', element: <GardenPeriodicTest /> },
          { path: 'garden/shrine/:bookId', element: <GardenShrine /> },
        ],
      },
      { path: 'science', element: <Science /> },
    ],
  },
]
