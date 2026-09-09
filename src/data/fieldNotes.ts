export type FieldNote = {
  slug: string;
  week: string;
  title: string;
  date: string;
  pinnedThought: string;
  paragraphs: string[];
  aiTool: string;
  aiUseNote: string;
  aiPrompt: string;
  published: boolean;
};

export const fieldNotes: FieldNote[] = [
  {
    slug: 'week-02',
    week: 'Week 02',
    title: 'Built Around People',
    date: 'September 1–7, 2026',
    pinnedThought: 'The technology should fit into human life, not force human life to bend around it.',
    paragraphs: [
      'Week 2 made human-centered AI feel less like a design principle and more like a responsibility. In our discussion about AI in parks and recreation, what stayed with me was not one specific use case, but the idea behind all of them: AI should support communities without quietly making people absorb the cost of the technology. Transparency, equity, privacy, human oversight, and community co-design all point to the same thing. “Human-centered” cannot just mean that the interface is easy to use.',
      'That connected directly to the kind of work I want to do in healthcare AI. I kept thinking about the question of who actually benefits from a system. An AI tool can make a workflow faster or more efficient, but if it makes people less heard, collects more data than necessary, leaves certain communities behind, or gives a system too much authority, then efficiency alone is not enough. The technology should fit into human life, not force human life to bend around it.',
      'One challenge for me is remembering that I naturally look at products through the eyes of the person building them. I know what I intended the system to do, so it is easy to assume the experience makes sense. This week reinforced that I am not every user. Listening to people, watching how they actually interact with a system, and designing with them rather than only for them can reveal things I would never notice on my own.',
      'The other idea that stayed with me came from our conversation with the Nittany AI Alliance about the skills needed to keep growing in AI. Curiosity stood out. This field changes too quickly to act like there is a point where you finally know enough. Staying curious means being willing to learn a new tool, question an old assumption, and admit when there is more to understand.',
      'That is probably my biggest takeaway from Week 2: building good AI requires both technical curiosity and human attention. I want to keep getting better at both.'
    ],
    aiTool: 'ChatGPT',
    aiUseNote: 'I used ChatGPT to help organize my original ideas and polish the final wording of this reflection. The learning moments, connections, and opinions are my own; AI helped me structure them without replacing my voice.',
    aiPrompt: 'Using only the ideas and course details I provide, help me organize my Week 2 reflection into a concise 300–500 word post. Focus on human-centered AI, community benefit, human oversight, and the importance of curiosity in a fast-changing AI field. Keep my voice natural, do not invent experiences, and make sure the reflection addresses key learning moments, personal connections, challenges/growth, and AI use. Polish the writing without making it sound generic or overly formal.',
    published: true
  },
  {
    slug: 'week-01',
    week: 'Week 01',
    title: 'The Human Part',
    date: 'August 25–31, 2026',
    pinnedThought: 'Human-centered design doesn’t stop at the interface.',
    paragraphs: [
      'Week 1 started mostly with introductions—getting a feel for what AI 285 would ask of us and how I wanted to document the semester. I decided to use my portfolio for these reflections because I did not want them to disappear into a Canvas submission after grading. My site already feels like my own Mac desktop, so a Field Notes folder felt like a natural place to keep a record of what I am learning, questioning, and changing my mind about.',
      'One discussion that stayed with me was our conversation about AI ethics and sustainability. We talked about the fact that AI systems have consequences beyond the person using the interface, including the communities and resources affected by the infrastructure behind them. That made me rethink what “human-centered” should actually mean. It cannot stop at making an app easy to navigate or making buttons intuitive. If a system is convenient for the user but creates harm somewhere else, I do not think we can honestly call it human-centered. The people around the technology, their communities, environments, cultures, and everyday lives have to count too.',
      'That connected naturally to our discussion of the United Nations Sustainable Development Goals. I ranked Good Health and Well-Being first, followed by Industry, Innovation and Infrastructure, and Reduced Inequalities. Those choices line up with my interest in healthcare AI, but they also pushed me to think beyond simply asking whether AI can solve a problem. I also have to ask who benefits, who may be left out, whether the system is reliable, and whether access to it is actually fair.',
      'Another thought I kept coming back to was how easy it is, as the person building something, to assume that other people will use it the way I do. I am not everyone. Watching another person interact with a product can reveal friction, confusion, or needs that I would never notice from my own point of view. That is probably one of the biggest mindset shifts I want to carry into my work: observe before assuming.',
      'As Week 2 begins, that is the idea I want to keep with me. Human-centered design is not just about making technology feel smooth. It is about making sure the technology fits into human life without asking people to bend themselves around it.'
    ],
    aiTool: 'ChatGPT',
    aiUseNote: 'I used ChatGPT to help organize my original thoughts and polish the final wording. The experiences, connections, and opinions in this reflection are my own; AI did not generate the underlying ideas.',
    aiPrompt: 'Using only the ideas and experiences I provide, help me organize my Week 1 reflection into a clear 300–500 word post. Keep my voice natural and reflective, do not invent experiences or opinions, and make sure the final piece addresses key learning moments, personal connections, challenges/growth, and how I used AI. Polish the writing for a professor without making it sound generic or overly formal.',
    published: true
  }
];

export const publishedFieldNotes = fieldNotes.filter((note) => note.published);
