export type DialogueNodeId = string;

export interface DialogueChoice {
  text: string;
  next: DialogueNodeId | null;
  isPONR?: boolean;
  minigameType?: 'tension' | 'rhythm';
  minigameDifficulty?: number;
  successNext?: DialogueNodeId;
  failNext?: DialogueNodeId;
  requireFlag?: { flag: string; value: string };
  giveItem?: string;
  effect?: string; // world flag effect string, e.g. "marekVoss=allied"
}

export interface DialogueNode {
  id: DialogueNodeId;
  speaker: string;
  text: string;
  choices: DialogueChoice[];
  effect?: string; // applied on entering this node
  isEnd?: boolean;
}

export interface DialogueTree {
  npcId: string;
  rootNode: DialogueNodeId;
  nodes: Record<DialogueNodeId, DialogueNode>;
}

// ─── Marek Voss ─────────────────────────────────────────────────────────────

export const marekVossDialogue: DialogueTree = {
  npcId: 'marekVoss',
  rootNode: 'greeting',
  nodes: {
    greeting: {
      id: 'greeting',
      speaker: 'Marek Voss',
      text: "You\'ve come further than most. I wasn\'t sure you\'d make it back from the second stratum. The Drowned Halls swallow the careless.",
      choices: [
        { text: "I need the seal to Stratum 3.", next: 'seal_request' },
        { text: "I found your supply cache. Why abandon it?", next: 'cache_question' },
        { text: "What aren\'t you telling me about the Abyss?", next: 'accusation' },
      ],
    },
    cache_question: {
      id: 'cache_question',
      speaker: 'Marek Voss',
      text: "The team I sent to retrieve it didn\'t come back. I couldn\'t justify sending more. The Compact\'s resources aren\'t infinite — despite what the Inquisitors claim.",
      choices: [
        { text: "I need the seal to Stratum 3.", next: 'seal_request' },
        { text: "What aren\'t you telling me?", next: 'accusation' },
      ],
    },
    seal_request: {
      id: 'seal_request',
      speaker: 'Marek Voss',
      text: "The seal opens the gate. You\'ll find it useful... if you found one in the archive, good. If not, I have a spare. What I need from you is a report. What have you seen in the second stratum?",
      choices: [
        { text: "Hollow-touched. Lots of them. The Compact\'s bindings are failing.", next: 'voss_knows' },
        { text: "I found evidence the Compact caused this. The harvest records.", next: 'confrontation' },
      ],
    },
    voss_knows: {
      id: 'voss_knows',
      speaker: 'Marek Voss',
      text: "Yes. We know. We\'ve known for some time. The official position is \'containable anomaly.\' The actual position is... less optimistic. Here — take the seal.",
      choices: [
        { text: "Why continue if you know it\'s hopeless?", next: 'voss_reason' },
        { text: "Thank you.", next: 'seal_given', effect: 'giveCompactSeal' },
      ],
    },
    voss_reason: {
      id: 'voss_reason',
      speaker: 'Marek Voss',
      text: "Because stopping looks a lot like dying. The Compact stops, the Hollow accelerates, and everything ends in a decade instead of a century. We are buying time. What happens with that time is someone else\'s problem.",
      choices: [
        { text: "That\'s not good enough.", next: 'confrontation' },
        { text: "Take the seal and go.", next: 'seal_given', effect: 'giveCompactSeal' },
      ],
    },
    confrontation: {
      id: 'confrontation',
      speaker: 'Marek Voss',
      text: "...You know. How much? The harvest ledgers... yes, I suppose those would be damning. I want to explain something to you before you do something we both regret.",
      choices: [
        {
          text: "You\'ve been compiling an execution order on me. [POINT OF NO RETURN — PERSUASION CHECK]",
          next: 'ponr',
          isPONR: true,
          minigameType: 'tension',
          minigameDifficulty: 0.65,
          successNext: 'voss_breaks',
          failNext: 'voss_hostile_outcome',
        },
        { text: "Then explain. Quickly.", next: 'voss_reason' },
      ],
    },
    ponr: {
      id: 'ponr',
      speaker: 'Marek Voss',
      text: "...",
      choices: [],
    },
    voss_breaks: {
      id: 'voss_breaks',
      speaker: 'Marek Voss',
      text: "The order exists. I haven\'t filed it. I have... been waiting to see what you found. The truth is, I need you to reach the Warden. The Compact does not. The Compact wants the Warden sealed and the Abyss forgotten. I want it ended. Take the seal. The Warden has a weakness in its third defense — the resonance lock. I know the frequency.",
      choices: [
        { text: "Why trust me now?", next: 'voss_trust' },
        { text: "I won\'t forget this, Voss.", next: 'seal_given_allied', effect: 'marekVoss=allied,giveCompactSeal' },
      ],
    },
    voss_trust: {
      id: 'voss_trust',
      speaker: 'Marek Voss',
      text: "Because you\'re the only one who\'s come back. That\'s the whole reason.",
      choices: [
        { text: "Understood.", next: 'seal_given_allied', effect: 'marekVoss=allied,giveCompactSeal' },
      ],
    },
    seal_given: {
      id: 'seal_given',
      speaker: 'Marek Voss',
      text: "Go carefully. The third stratum is worse than the second. Something down there is aware of us.",
      choices: [],
      effect: 'giveCompactSeal',
      isEnd: true,
    },
    seal_given_allied: {
      id: 'seal_given_allied',
      speaker: 'Marek Voss',
      text: "The Warden\'s lock resonates at the frequency of regret. You\'ll know it when you hear it. Aim there.",
      choices: [],
      effect: 'marekVoss=allied,giveCompactSeal',
      isEnd: true,
    },
    voss_hostile_outcome: {
      id: 'voss_hostile_outcome',
      speaker: 'Marek Voss',
      text: "That was a mistake. Guards! — Get out. Now. Don\'t be in Ashfeld when I return from the telegraph office.",
      choices: [],
      effect: 'marekVoss=hostile,compactHostile=true',
      isEnd: true,
    },
    accusation: {
      id: 'accusation',
      speaker: 'Marek Voss',
      text: "There are things I don\'t tell you because knowing them would get you killed faster. There are things I don\'t tell you because they\'re above your clearance. And there are things I don\'t tell you because I don\'t know them. Take your pick.",
      choices: [
        { text: "I found the harvest records. I know what the Compact did.", next: 'confrontation' },
        { text: "Fine. I just need the seal.", next: 'seal_request' },
      ],
    },
  },
};

// ─── Sister Aelith ───────────────────────────────────────────────────────────

export const sisterAelithDialogue: DialogueTree = {
  npcId: 'sisterAelith',
  rootNode: 'greeting',
  nodes: {
    greeting: {
      id: 'greeting',
      speaker: 'Sister Aelith',
      text: "I don\'t have visitors often. The lower district has a way of discouraging them. You\'re going into the Abyss. I can tell by what you\'re carrying — and by what you haven\'t sold yet.",
      choices: [
        { text: "I need help understanding what\'s down there.", next: 'knowledge_offer' },
        { text: "What did you do for the Compact?", next: 'compact_past' },
      ],
    },
    knowledge_offer: {
      id: 'knowledge_offer',
      speaker: 'Sister Aelith',
      text: "I can tell you what I know about the lower strata. The sigil-language used in the Warden\'s binding is old — pre-Compact. I spent twelve years translating it before they asked me to stop. Before they made it very clear what \'stop\' meant.",
      choices: [
        { text: "Can you translate it in the field? Inside the Abyss?", next: 'field_request' },
        { text: "Why haven\'t you left Ashfeld?", next: 'why_stay' },
      ],
    },
    compact_past: {
      id: 'compact_past',
      speaker: 'Sister Aelith',
      text: "I was a Hollow Scholar. I studied the language of the binding — the original sigils that the Compact now uses to harvest souls. I found something they didn\'t want found. The cost of the binding. Who pays it.",
      choices: [
        { text: "Who pays it?", next: 'the_cost' },
      ],
    },
    the_cost: {
      id: 'the_cost',
      speaker: 'Sister Aelith',
      text: "Everyone. Every soul that\'s ever been bound into an artifact, a weapon, an engine — they\'re still in there. Aware. The Hollow is their grief, accumulated over three centuries, pressing back against the world that imprisoned them. The Compact knows. They always knew.",
      choices: [
        { text: "Can it be reversed?", next: 'reversal_question' },
        { text: "Come with me into the Abyss. I need your translation.", next: 'field_request' },
      ],
    },
    why_stay: {
      id: 'why_stay',
      speaker: 'Sister Aelith',
      text: "I\'m afraid. I know that\'s not the answer you were hoping for. The Abyss does something to memory — the deeper you go, the more you lose. I\'ve seen what comes back. I\'m afraid of what I\'d lose.",
      choices: [
        { text: "You can lose the fear down there. It\'s worse up here, waiting.", next: 'field_request' },
        { text: "I understand. I\'ll manage without you.", next: 'gentle_leave' },
      ],
    },
    reversal_question: {
      id: 'reversal_question',
      speaker: 'Sister Aelith',
      text: "Theoretically. A Measured Release — unbinding every soul simultaneously, but slowly, in sequence, over years. The Hollow would recede. The bound artifacts would stop working. The Compact\'s entire power base would dissolve. That\'s why my research was suppressed.",
      choices: [
        { text: "There are instructions in the Abyss, aren\'t there. In the sigils.", next: 'field_request' },
      ],
    },
    field_request: {
      id: 'field_request',
      speaker: 'Sister Aelith',
      text: "You\'re asking me to go into the Abyss. To the place that — you don\'t understand what it does to people who know too much about it. I spent years charting its language. It charted mine in return.",
      choices: [
        {
          text: "I need you there. The world needs you there. [POINT OF NO RETURN — PERSUASION CHECK]",
          next: 'ponr',
          isPONR: true,
          minigameType: 'tension',
          minigameDifficulty: 0.7,
          successNext: 'aelith_agrees',
          failNext: 'aelith_refuses',
        },
        { text: "I won\'t force you. But consider it.", next: 'gentle_leave' },
      ],
    },
    ponr: {
      id: 'ponr',
      speaker: 'Sister Aelith',
      text: "...",
      choices: [],
    },
    aelith_agrees: {
      id: 'aelith_agrees',
      speaker: 'Sister Aelith',
      text: "Alright. Alright. I\'ll... I need a day to prepare. Come back before you descend. I can read the deep sigils. I\'ll slow down for you. I won\'t let the Hollow take my memory before I\'ve finished what I started.",
      choices: [],
      effect: 'sisterAelith=allied,aelithTranslationAvailable=true',
      isEnd: true,
    },
    aelith_refuses: {
      id: 'aelith_refuses',
      speaker: 'Sister Aelith',
      text: "I can\'t. I\'m sorry. I want to, and I can\'t. Don\'t look at me like that — you don\'t know what it costs to say this. Please go.",
      choices: [],
      effect: 'sisterAelith=alive',
      isEnd: true,
    },
    gentle_leave: {
      id: 'gentle_leave',
      speaker: 'Sister Aelith',
      text: "Good luck down there. Write down everything you see. Trust your notes more than your memory, the deeper you go.",
      choices: [],
      isEnd: true,
    },
  },
};

// ─── Gorveth ─────────────────────────────────────────────────────────────────

export const gorvethDialogue: DialogueTree = {
  npcId: 'gorveth',
  rootNode: 'greeting',
  nodes: {
    greeting: {
      id: 'greeting',
      speaker: 'Gorveth',
      text: "You don\'t look like Compact. But you\'re not starving, either, so you\'re working for someone. Lower district rules: I don\'t ask about your contracts, you don\'t ask about mine.",
      choices: [
        { text: "I need access through the Hollow Seam.", next: 'seam_request' },
        { text: "I\'m trying to stop the Hollow. Not contain it — stop it.", next: 'mission_claim' },
      ],
    },
    mission_claim: {
      id: 'mission_claim',
      speaker: 'Gorveth',
      text: "That\'s what everyone says before they make a deal that doesn\'t actually stop it. The Compact says that. The scholars say that. Even the Unbinders said it once, before we started running out of time.",
      choices: [
        { text: "You\'re an Unbinder.", next: 'unbinder_reveal' },
        { text: "I\'ve read the harvest records. I know what the Compact did.", next: 'records_mention' },
      ],
    },
    unbinder_reveal: {
      id: 'unbinder_reveal',
      speaker: 'Gorveth',
      text: "Was. Am. The label gets complicated when half your cell is dead and the other half is wanted. What do you want from the Unbinders that you think we have?",
      choices: [
        { text: "Access to the Hollow Seam — a route to Stratum 3.", next: 'seam_request' },
      ],
    },
    records_mention: {
      id: 'records_mention',
      speaker: 'Gorveth',
      text: "Then you know why we don\'t negotiate with the Compact. My squad died in Stratum 4 doing a soul-harvest extraction. The Compact knew the risks. They sent us anyway. I was the only one who came back because I was the only one who ran.",
      choices: [
        { text: "I\'m not Compact. Let me prove it.", next: 'trust_question' },
        { text: "Then help me end this.", next: 'seam_request' },
      ],
    },
    seam_request: {
      id: 'seam_request',
      speaker: 'Gorveth',
      text: "The Seam cuts three strata. Fast and ugly — the Hollow\'s worse in there. I\'d open it for someone I trusted. You I don\'t trust. You\'ve been talking to Voss.",
      choices: [
        { text: "Voss gave me information. I didn\'t give him yours.", next: 'trust_question' },
        { text: "I can\'t prove what I haven\'t done.", next: 'ponr_setup' },
      ],
    },
    trust_question: {
      id: 'trust_question',
      speaker: 'Gorveth',
      text: "Prove it, then. Destroy one of your soul-bound items — here, in front of me. If you\'re willing to give up power to make the point, maybe you mean it.",
      choices: [
        {
          text: "Agreed. [POINT OF NO RETURN — PROVE YOUR CONVICTION]",
          next: 'ponr',
          isPONR: true,
          minigameType: 'tension',
          minigameDifficulty: 0.55,
          successNext: 'gorveth_opens',
          failNext: 'gorveth_rejects',
        },
        { text: "I\'m not giving up my equipment.", next: 'gorveth_hard_no' },
      ],
    },
    ponr_setup: {
      id: 'ponr_setup',
      speaker: 'Gorveth',
      text: "No. But you can demonstrate what you\'re willing to sacrifice. Destroy something of yours — something soul-bound. Do that and I\'ll believe you\'re not a Compact agent.",
      choices: [
        {
          text: "[POINT OF NO RETURN — CONVINCE HIM]",
          next: 'ponr',
          isPONR: true,
          minigameType: 'tension',
          minigameDifficulty: 0.55,
          successNext: 'gorveth_opens',
          failNext: 'gorveth_rejects',
        },
        { text: "No deal.", next: 'gorveth_hard_no' },
      ],
    },
    ponr: {
      id: 'ponr',
      speaker: 'Gorveth',
      text: "...",
      choices: [],
    },
    gorveth_opens: {
      id: 'gorveth_opens',
      speaker: 'Gorveth',
      text: "Good. That was... good. Alright. The Seam opens from the lower archive — you\'ll find a chalk marker on the east wall. Three long lines. Pull the stone below it. And if you reach the Warden — don\'t bind it. Release it.",
      choices: [],
      effect: 'gorveth=allied,unbinderAllied=true,gorvethSeamOpen=true',
      isEnd: true,
    },
    gorveth_rejects: {
      id: 'gorveth_rejects',
      speaker: 'Gorveth',
      text: "You hesitated. Compact agent or not, you hesitated — which means you\'re not ready to give anything up. Come back when you are. Or don\'t come back.",
      choices: [],
      effect: 'gorveth=hostile',
      isEnd: true,
    },
    gorveth_hard_no: {
      id: 'gorveth_hard_no',
      speaker: 'Gorveth',
      text: "Then we have nothing to discuss. The Seam stays closed. Go through the Compact gate like everyone else.",
      choices: [],
      isEnd: true,
    },
  },
};
