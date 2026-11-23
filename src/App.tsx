import { useState } from 'react';
import { AnalysisBoard } from './AnalysisBoard';
import { CourseOverview } from './CourseOverview';
import { Drill, type DrillMode } from './Drill';
import type { Course } from './courses/types';
import viennaJson from './courses/vienna.json';

const vienna = viennaJson as Course;

type Screen =
  | { name: 'home' }
  | { name: 'analysis' }
  | { name: 'course' }
  | { name: 'drill'; mode: DrillMode };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const home = () => setScreen({ name: 'home' });

  switch (screen.name) {
    case 'analysis':
      return <AnalysisBoard onBack={home} />;
    case 'course':
      return (
        <CourseOverview
          course={vienna}
          onBack={home}
          onStart={(mode) => setScreen({ name: 'drill', mode })}
        />
      );
    case 'drill':
      return (
        <Drill
          key={screen.mode}
          course={vienna}
          mode={screen.mode}
          onBack={() => setScreen({ name: 'course' })}
        />
      );
    default:
      return (
        <div className="app page">
          <h1>Chess Teacher</h1>
          <button className="big wide" onClick={() => setScreen({ name: 'course' })}>
            {vienna.name}
            <small>Openings · White</small>
          </button>
          <button className="big wide" onClick={() => setScreen({ name: 'analysis' })}>
            Analysis board
            <small>Free play with Stockfish</small>
          </button>
        </div>
      );
  }
}
