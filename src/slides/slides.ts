import { createElement } from 'react';
import type { JSX } from 'react';
import Flowchart from '../activities/Flowchart';
import FlipCards from '../activities/FlipCards';
import Habits from '../activities/Habits';
import KitDownload from '../activities/KitDownload';
import LiuduCompare from '../activities/LiuduCompare';
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
import ToolsLink from './ToolsLink';
import WorkflowsTable from './WorkflowsTable';

export interface SlideContext {
  isPresenter: boolean;
}

export interface SlideDef {
  id: SlideId;
  section: SectionId;
  title: string;
  body: string[];
  kind: 'content' | 'activity';
  activity?: ActivityId;
  Extra?: ActivityComponent;
  render: (ctx: SlideContext) => JSX.Element;
}

export const sectionLabels: Record<SectionId, string> = copy.sections;

function compose(
  id: SlideId,
  section: SectionId,
  kind: SlideDef['kind'],
  Extra?: ActivityComponent,
  activityId?: ActivityId,
): SlideDef {
  const { title, body } = copy.slides[id];
  return {
    id,
    section,
    title,
    body,
    kind,
    activity: activityId,
    Extra,
    render: (ctx) =>
      Extra
        ? createElement(
            'div',
            { className: 'flex flex-col' },
            createElement(SlideText, { title, body, compact: true }),
            createElement('div', { className: 'px-4 pb-6 sm:px-8' }, createElement(Extra, ctx)),
          )
        : createElement(SlideText, { title, body }),
  };
}

function content(id: SlideId, section: SectionId): SlideDef {
  return compose(id, section, 'content');
}

function activity(id: SlideId, section: SectionId, component: ActivityComponent, activityId?: ActivityId): SlideDef {
  return compose(id, section, 'activity', component, activityId);
}

function contentWith(id: SlideId, section: SectionId, component: ActivityComponent): SlideDef {
  return compose(id, section, 'content', component);
}

export const slides: SlideDef[] = [
  content('opening', 0),
  activity('warmup', 1, Warmup, 'warmup'),
  content('what-changed', 2),
  activity('habits', 2, Habits, 'habits'),
  content('principles', 2),
  content('chat-vs-agent', 3),
  activity('concepts', 3, FlipCards),
  content('logic', 3),
  activity('flowchart', 3, Flowchart),
  content('demo-plan', 3),
  content('demo-factcheck', 3),
  content('demo-subagents', 3),
  contentWith('workflows', 3, WorkflowsTable),
  activity('wishlist', 4, Wishlist, 'wishlist'),
  content('setup-check', 5),
  activity('folder-rules', 5, KitDownload),
  content('race-intro', 5),
  activity('race', 5, Race, 'race'),
  activity('race-board', 5, RaceBoard, 'race'),
  content('own-case', 5),
  activity('scenario', 6, Scenario, 'scenario'),
  activity('liudu', 6, LiuduCompare),
  contentWith('next-steps', 6, ToolsLink),
];
