import { createElement } from 'react';
import type { JSX } from 'react';
import Flowchart from '../activities/Flowchart';
import FlipCards from '../activities/FlipCards';
import Habits from '../activities/Habits';
import PendingActivity from '../activities/PendingActivity';
import Race from '../activities/Race';
import RaceBoard from '../activities/RaceBoard';
import Scenario from '../activities/Scenario';
import type { ActivityComponent } from '../activities/types';
import Warmup from '../activities/Warmup';
import Wishlist from '../activities/Wishlist';
import { copy } from '../content/copy';
import type { SlideId } from '../content/copy';
import type { ActivityId, SectionId } from '../lib/types';
import SlideText from './SlideText';

export interface SlideContext {
  isPresenter: boolean;
}

export interface SlideDef {
  id: SlideId;
  section: SectionId;
  title: string;
  kind: 'content' | 'activity';
  activity?: ActivityId;
  render: (ctx: SlideContext) => JSX.Element;
}

export const sectionLabels: Record<SectionId, string> = copy.sections;

function content(id: SlideId, section: SectionId): SlideDef {
  const { title, body } = copy.slides[id];
  return { id, section, title, kind: 'content', render: () => createElement(SlideText, { title, body }) };
}

function activity(id: SlideId, section: SectionId, component: ActivityComponent, activityId?: ActivityId): SlideDef {
  const { title, body } = copy.slides[id];
  return {
    id,
    section,
    title,
    kind: 'activity',
    activity: activityId,
    render: (ctx) =>
      createElement(
        'div',
        { className: 'flex flex-col' },
        createElement(SlideText, { title, body, compact: true }),
        createElement('div', { className: 'px-4 pb-6 sm:px-8' }, createElement(component, ctx)),
      ),
  };
}

export const slides: SlideDef[] = [
  content('opening', 0),
  activity('warmup', 1, Warmup, 'warmup'),
  content('what-changed', 2),
  activity('habits', 2, Habits, 'habits'),
  content('chat-vs-agent', 3),
  activity('concepts', 3, FlipCards),
  content('logic', 3),
  activity('flowchart', 3, Flowchart),
  content('demo-plan', 3),
  content('demo-factcheck', 3),
  content('demo-subagents', 3),
  activity('wishlist', 4, Wishlist, 'wishlist'),
  content('setup-check', 5),
  content('folder-rules', 5),
  content('race-intro', 5),
  activity('race', 5, Race, 'race'),
  activity('race-board', 5, RaceBoard, 'race'),
  content('own-case', 5),
  activity('scenario', 6, Scenario, 'scenario'),
  activity('liudu', 6, PendingActivity),
  content('next-steps', 6),
];
