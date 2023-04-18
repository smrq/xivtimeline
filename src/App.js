import { PartyTimeline } from './timeline/PartyTimeline';
import { getFight, getJob } from './data';
import './App.css';

const fight = getFight('p8s2');
const jobs = ['WHM', 'SGE', 'WAR', 'GNB'].map(getJob);

export default function App() {
  return (
    <>
      <h1>FFXIV Mitigation Planner</h1>
      <h3>{fight.name}</h3>
      <PartyTimeline
        fight={fight}
        jobs={jobs}
      />
    </>
  );
};
