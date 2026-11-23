import type { Course } from './courses/types';
import type { DrillMode } from './Drill';

type Props = { course: Course; onStart: (mode: DrillMode) => void; onBack: () => void };

export function CourseOverview({ course, onStart, onBack }: Props) {
  const o = course.overview;
  return (
    <div className="app page">
      <div className="controls">
        <button onClick={onBack}>← Home</button>
      </div>
      <h1>{course.name}</h1>
      <p className="muted">{course.scope}</p>

      <div className="start-row">
        <button className="big" onClick={() => onStart('learn')}>
          Learn
          <small>Arrows show each move</small>
        </button>
        <button className="big" onClick={() => onStart('practice')}>
          Practice
          <small>Play from memory</small>
        </button>
      </div>

      <h2>The idea</h2>
      <p>{o.idea}</p>
      <h2>Typical position</h2>
      <p>{o.structure}</p>
      <h2>Plans</h2>
      <ul>
        {o.plans.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <h2>Key ideas</h2>
      {o.concepts.map((c) => (
        <div className="note" key={c.id}>
          <div className="note-move">{c.title}</div>
          <div>{c.text}</div>
        </div>
      ))}
    </div>
  );
}
