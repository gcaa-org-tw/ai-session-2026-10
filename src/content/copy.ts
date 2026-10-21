import type { Bin, SectionId, WarmMark, WishBin } from '../lib/types';

export type SlideId =
  | 'opening'
  | 'warmup'
  | 'what-changed'
  | 'habits'
  | 'chat-vs-agent'
  | 'concepts'
  | 'logic'
  | 'flowchart'
  | 'demo-plan'
  | 'demo-factcheck'
  | 'demo-subagents'
  | 'wishlist'
  | 'setup-check'
  | 'folder-rules'
  | 'race-intro'
  | 'race'
  | 'race-board'
  | 'own-case'
  | 'scenario'
  | 'liudu'
  | 'next-steps';

export interface SlideCopy {
  title: string;
  body: string[];
}

export interface WorkType {
  id: string;
  label: string;
}

export interface HabitCard {
  id: string;
  defaultBin: Bin;
  text: string;
  example: string;
}

export interface Metaphor {
  id: string;
  term: string;
  gloss: string;
  front: string;
  back: string;
}

export interface FlowStep {
  id: string;
  label: string;
  detail: string;
  next: string[];
}

export interface WishQuestions {
  repeats: string;
  rulesWritable: string;
  sourceCheckable: string;
}

export interface ScenarioPrompts {
  what: string;
  files: string;
  gain: string;
}

export interface StateLabels {
  loading: string;
  empty: string;
  saving: string;
  saved: string;
  saveError: string;
  retry: string;
  waiting: string;
  presenterOnly: string;
  loadError: string;
  reload: string;
}

export interface RaceLabels {
  roleLabel: string;
  pairCodeLabel: string;
  pairCodeHint: string;
  tapHint: string;
  downloadKit: string;
  submittedCount: string;
  waitingReveal: string;
  caught: string;
  missed: string;
  falseAlarms: string;
  averagePerEntry: string;
  perSentence: string;
  explanation: string;
}

export interface Copy {
  slides: Record<SlideId, SlideCopy>;
  workTypes: WorkType[];
  warmMarks: Record<WarmMark, string>;
  warmNotePlaceholder: string;
  bins: Record<Bin, string>;
  habitCards: HabitCard[];
  metaphors: Metaphor[];
  flowchart: FlowStep[];
  wishQuestions: WishQuestions;
  wishBins: Record<WishBin, string>;
  wishPlaceholder: string;
  optInLabel: string;
  scenarioPrompts: ScenarioPrompts;
  verdicts: Record<'match' | 'mismatch' | 'nosource', string>;
  roles: Record<'human' | 'agent', string>;
  states: StateLabels;
  sections: Record<SectionId, string>;
  race: RaceLabels;
}

export const copy: Copy = {
  slides: {
    opening: {
      title: '今天的目標',
      body: [
        '離開時，每個人手上都有一件自己的工作，交給代理會比手做更快或更準。',
        '兩小時的路線：你現在怎麼用 AI → 哪些習慣該換 → 聊天和代理差在哪 → 列出想交出去的工作 → 實際動手 → 帶走自己的情境',
      ],
    },
    warmup: {
      title: 'AI 在你一週裡的位置',
      body: [
        '下面是團隊近半年實際的工作類型。每一項選一個：已經在用 AI、用了反而更麻煩、還沒用過。',
        '有一句話想補充，寫在最下面。',
      ],
    },
    'what-changed': {
      title: '什麼改變了',
      body: [
        '你不必字斟句酌，它也讀得懂意思。',
        '回答前，它會自己先推理。',
        '整份文件可以一次給它。',
        '它能自己查資料、開檔案，做完再回頭檢查。',
        '背景和規則存在檔案裡，不必每次重講。',
      ],
    },
    habits: {
      title: '習慣分類',
      body: [
        '每張卡片放進一格：過時、仍然有用、新習慣。',
        '沒有標準答案，揭曉時看大家怎麼分，再討論分歧。',
      ],
    },
    'chat-vs-agent': {
      title: '聊天和代理差在哪',
      body: [
        '聊天：你把資料貼進去，它回你一段文字，下一步由你決定。',
        '代理：你給它一個資料夾和一項任務，它自己開檔案、查資料、做完一連串步驟，再回報結果。',
      ],
    },
    concepts: {
      title: '八個概念',
      body: ['點一下卡片，看背面的工作例子。'],
    },
    logic: {
      title: '三種基本邏輯',
      body: [
        '輸入 → 處理 → 輸出：給它文件和名單，照查核步驟比對，得到一張查核表。',
        '如果……就……：如果找得到依據，就比對內容；如果找不到，就標「查無來源」。',
        '對清單每一項重複做：新聞稿裡的每一句、名單上的每一位候選人，都做同樣的檢查。',
      ],
    },
    flowchart: {
      title: '事實查核的流程',
      body: ['這就是等一下要用的 skill。點一下每個步驟看說明。'],
    },
    'demo-plan': {
      title: '示範一：先計畫，再動手',
      body: [
        '用 /plan 請它先提出計畫。',
        '看它列出的步驟，修正其中一項，再按下執行。',
      ],
    },
    'demo-factcheck': {
      title: '示範二：事實查核',
      body: [
        '用 /fact-check 查核一份已發布的新聞稿，依據是同一份報告。',
        '看它怎麼標出相符、不符和查無來源。',
      ],
    },
    'demo-subagents': {
      title: '示範三：分工給子代理',
      body: [
        '一份有幾十個註腳的說帖，交給它查證每一個引用。',
        '看它怎麼把工作分給幾個子代理，再把結果彙整回來。',
      ],
    },
    wishlist: {
      title: '願望清單',
      body: [
        '寫下一到三件你想交給 AI 的工作，每件回答三個問題，系統會把它放進其中一格。',
        '勾選「留名，方便後續協助」，只有主持人看得到你的名字。',
      ],
    },
    'setup-check': {
      title: '確認安裝',
      body: [
        '打開 Antigravity，確認已經用 gcaa.org.tw 帳號登入。',
        '有問題先和旁邊的同事一起看，不必等。',
      ],
    },
    'folder-rules': {
      title: '建一個任務資料夾',
      body: [
        '在簡報頁面下載練習包，解壓縮到一個新資料夾。',
        '在 Antigravity 開啟這個資料夾。',
        '打開 AGENTS.md：這就是規則檔。讀一遍，想加一條就加。',
      ],
    },
    'race-intro': {
      title: '查核競賽',
      body: [
        '兩人一組：一人用眼睛查，另一人請代理執行 /fact-check。',
        '以「六都簽署名單.csv」為準，模擬稿裡藏了幾處錯誤。',
        '找到問題就在頁面上點那一句，選相符、不符或查無來源。代理的結果由操作的人輸入。',
        '十分鐘。',
      ],
    },
    race: {
      title: '查核模擬稿',
      body: ['先選身分：人工查核或代理查核，再填組別代碼。'],
    },
    'race-board': {
      title: '誰抓到什麼',
      body: [
        '每一處錯誤，人工和代理各有幾組抓到。',
        '也看看誤判：把正確的句子標成錯誤。',
      ],
    },
    'own-case': {
      title: '換成你自己的工作',
      body: [
        '從你的願望清單挑一件。',
        '建一個新資料夾，放進相關檔案，寫三行規則。',
        '用 /plan 請它先提出計畫，或直接用 /fact-check 查核你自己的文件。',
        '做完一輪後，開一個新對話再試一次：新對話不會帶著前面的內容。',
      ],
    },
    scenario: {
      title: '帶走一個情境',
      body: ['寫下你回去之後要交給代理的一件工作。'],
    },
    liudu: {
      title: '同一份資料，兩種呈現',
      body: ['左邊是一張圖，右邊是可以篩選的網頁。'],
    },
    'next-steps': {
      title: '之後',
      body: [
        '想用終端機版本的人，可以再試 Antigravity CLI。',
        '願望清單上需要協助建置的項目，會再個別聯絡留名的人。',
        '這份簡報的連結會保留，可以隨時回來看。',
      ],
    },
  },
  workTypes: [
    {
      id: 'press',
      label: '記者會',
    },
    {
      id: 'visit',
      label: '拜會官員與候選人',
    },
    {
      id: 'hearing',
      label: '公聽會與研商會',
    },
    {
      id: 'talk',
      label: '映後座談與演講',
    },
    {
      id: 'rating',
      label: '評比與指標研究',
    },
    {
      id: 'coalition',
      label: '聯盟協調',
    },
    {
      id: 'fundraising',
      label: '募款活動',
    },
    {
      id: 'media',
      label: '媒體採訪',
    },
  ],
  warmMarks: {
    using: '已經在用 AI',
    worse: '用了反而更麻煩',
    none: '還沒用過',
  },
  warmNotePlaceholder: '想補充一句：哪裡好用、哪裡卡住',
  bins: {
    outdated: '過時',
    useful: '仍然有用',
    new: '新習慣',
  },
  habitCards: [
    {
      id: 'h1',
      defaultBin: 'outdated',
      text: '開頭先說「你是一位世界級的政策專家」',
      example: '寫拜會說帖前先指定角色。說清楚讀者是誰、要拿來做什麼，效果比較好。',
    },
    {
      id: 'h2',
      defaultBin: 'outdated',
      text: '背誦固定的提示詞範本',
      example: '把網路流傳的萬用範本套在公聽會紀錄整理上，多了一堆用不到的格式要求。',
    },
    {
      id: 'h3',
      defaultBin: 'outdated',
      text: '加一句「請一步一步思考」',
      example: '現在的模型多半會自己先推理，這句可以省掉。需要時，直接寫出判斷的標準。',
    },
    {
      id: 'h4',
      defaultBin: 'outdated',
      text: '把報告切成小段再貼上',
      example: '整份研商會議紀錄可以一次給它；切成小段，它反而看不到前後文。',
    },
    {
      id: 'h5',
      defaultBin: 'outdated',
      text: '每開一個新對話就重打一次背景',
      example: '每次都重新介紹「我們是環保團體，正在做六都倡議」。這些可以寫進規則檔，寫一次就好。',
    },
    {
      id: 'h6',
      defaultBin: 'outdated',
      text: '請它憑記憶提供法條或數據，不附來源',
      example: '問它碳費費率是多少就直接引用。它常答得很肯定，數字卻不一定對。',
    },
    {
      id: 'h7',
      defaultBin: 'useful',
      text: '說清楚給誰看、最後要做成什麼',
      example: '「這份是給議員助理看的一頁摘要，要能在五分鐘內讀完。」',
    },
    {
      id: 'h8',
      defaultBin: 'useful',
      text: '附上你要的成品範例',
      example: '編修年報時附上原文，說明「保留原本的措辭，只修正這幾處」。',
    },
    {
      id: 'h9',
      defaultBin: 'useful',
      text: '自己檢查結果',
      example: 'AI 整理的候選人政見對照表，人名和數字仍要對回原始資料。',
    },
    {
      id: 'h10',
      defaultBin: 'useful',
      text: '對話太長時開新對話',
      example: '對話拉得越長，前面交代的事越容易被忽略。',
    },
    {
      id: 'h11',
      defaultBin: 'new',
      text: '先讓它問你問題，或先提出計畫',
      example: '整理會員大會資料前，先請它列出打算怎麼做，確認後再開始。',
    },
    {
      id: 'h12',
      defaultBin: 'new',
      text: '把規則寫成一份檔案',
      example: '用詞規範、引用格式、不得捏造數字，寫成工作守則放在資料夾裡，每次開工自動讀取。',
    },
    {
      id: 'h13',
      defaultBin: 'new',
      text: '在任務資料夾留下進度和決定',
      example: '評比做到一半，下次接手時，它和同事都知道做到哪裡、為什麼這樣決定。',
    },
    {
      id: 'h14',
      defaultBin: 'new',
      text: '交給它做，再由你驗收',
      example: '讓它把各縣市的回覆表格對照評分標準整理一遍，你抽查其中幾格。',
    },
    {
      id: 'h15',
      defaultBin: 'new',
      text: '糾正一次，讓它記住',
      example: '它把「臺」寫成「台」被你改過一次，就把這條規則記下來，下次不再犯。',
    },
  ],
  metaphors: [
    {
      id: 'tool',
      term: '工具呼叫',
      gloss: '讓 AI 自己動手使用工具',
      front: '會自己翻抽屜、打電話的實習生',
      back: '聊天時，資料要你一份份貼給它。代理會自己打開資料夾裡的檔案、上網查證、做計算，再回報結果。',
    },
    {
      id: 'mcp',
      term: 'MCP',
      gloss: '連接外部系統的共通規格',
      front: '萬用轉接頭',
      back: '接上法規與判決資料庫後，它可以直接查詢條文和判決，不必你先下載再貼上。',
    },
    {
      id: 'skill',
      term: 'skill',
      gloss: '寫好的工作流程',
      front: 'SOP 手冊',
      back: '等一下要用的事實查核就是一份 skill：逐句挑出主張、對照資料、列表回報，每次都照同樣的步驟做。',
    },
    {
      id: 'command',
      term: '斜線指令',
      gloss: '以「/」開頭的快速指令',
      front: '叫號',
      back: '輸入 /plan，它就先提出計畫再動手；輸入 /fact-check，它就照查核手冊執行。',
    },
    {
      id: 'rules',
      term: '規則檔',
      gloss: '每次開工前自動讀取的守則',
      front: '貼在牆上的工作守則',
      back: '「使用台灣用語」「每個判斷都要附依據」「查不到就寫查無來源」，寫一次，之後每項任務都適用。',
    },
    {
      id: 'hook',
      term: 'hook',
      gloss: '由系統強制執行的規則',
      front: '門禁',
      back: '例如規定信箱只能讀、不能寄：不管 AI 記不記得這條規則，寄信的動作都會被擋下來。',
    },
    {
      id: 'memory',
      term: '記憶',
      gloss: '跨對話保留的筆記',
      front: '交接筆記本',
      back: '你糾正過的事、專案的背景，記在筆記裡，下次開新對話時它會先讀。',
    },
    {
      id: 'subagent',
      term: '子代理',
      gloss: '分派出去的小幫手',
      front: '分工給組員',
      back: '一份有幾十個註腳的說帖，可以分給幾個子代理同時查證，各自回報後再彙整。',
    },
  ],
  flowchart: [
    {
      id: 'f1',
      label: '讀進整份文件',
      detail: '先讀完全文，才知道每一句的前後文。',
      next: ['f2'],
    },
    {
      id: 'f2',
      label: '挑出下一句有主張的句子',
      detail: '數字、人名、地名、日期、立場都算主張；純粹的意見或呼籲跳過。',
      next: ['f3'],
    },
    {
      id: 'f3',
      label: '資料夾裡有依據嗎？',
      detail: '只看資料夾裡的檔案，不上網，也不憑記憶。',
      next: [
        'f4',
        'f5',
      ],
    },
    {
      id: 'f4',
      label: '有：內容一致嗎？',
      detail: '比對文件的說法和依據的說法。',
      next: [
        'f6',
        'f7',
      ],
    },
    {
      id: 'f5',
      label: '沒有：標記查無來源',
      detail: '查不到就說查不到，不要補上看起來合理的答案。',
      next: ['f8'],
    },
    {
      id: 'f6',
      label: '一致：標記相符',
      detail: '寫出依據在哪一個檔案、哪一列。',
      next: ['f8'],
    },
    {
      id: 'f7',
      label: '不一致：標記不符',
      detail: '同時寫出文件的說法和依據的說法。',
      next: ['f8'],
    },
    {
      id: 'f8',
      label: '還有下一句嗎？',
      detail: '有就回到挑句子那一步，這就是「對每一項重複做」。',
      next: [
        'f2',
        'f9',
      ],
    },
    {
      id: 'f9',
      label: '輸出查核表',
      detail: '一句一列：句子、主張、依據、判定、說明，最後附上統計。',
      next: [],
    },
  ],
  wishQuestions: {
    repeats: '這件事會重複發生嗎？',
    rulesWritable: '做法能寫成明確的步驟或規則嗎？',
    sourceCheckable: '做完的結果，有來源可以驗證嗎？',
  },
  wishBins: {
    now: '現在就能做',
    build: '請人協助建置',
    learn: '你可以學',
  },
  wishPlaceholder: '例如：把每場公聽會的逐字稿整理成各單位的承諾清單',
  optInLabel: '留名，方便後續協助',
  scenarioPrompts: {
    what: '回去之後，你要交給代理的是哪一件工作？',
    files: '會用到哪些檔案或資料？',
    gain: '跟手做相比，好在哪裡：更快、更準，還是更完整？',
  },
  verdicts: {
    match: '相符',
    mismatch: '不符',
    nosource: '查無來源',
  },
  roles: {
    human: '人工查核',
    agent: '代理查核',
  },
  states: {
    loading: '載入中',
    empty: '還沒有人填寫',
    saving: '儲存中',
    saved: '已儲存',
    saveError: '儲存失敗',
    retry: '再試一次',
    waiting: '等待主持人開始',
    presenterOnly: '此頁僅限主持人',
    loadError: '載入失敗',
    reload: '重新載入',
  },
  sections: {
    0: '開場',
    1: '暖身',
    2: '習慣更新',
    3: '從聊天到代理',
    4: '願望清單',
    5: '動手做',
    6: '收尾',
  },
  race: {
    roleLabel: '你這組負責',
    pairCodeLabel: '組別代碼',
    pairCodeHint: '和同組的人填一樣的代碼',
    tapHint: '點一句話，選擇判定',
    downloadKit: '下載練習包',
    submittedCount: '已送出',
    waitingReveal: '等待主持人揭曉',
    caught: '抓到',
    missed: '漏掉',
    falseAlarms: '誤判',
    averagePerEntry: '每份平均',
    perSentence: '各句被抓到的份數',
    explanation: '說明',
  },
};
