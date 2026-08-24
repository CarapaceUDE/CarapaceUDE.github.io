window.WORKSHOP_SLIDES = [
  {
    id: "title", n: 1, layout: "title", kicker: "Your company. Your tools.",
    title: "You Can Build It Now",
    sub: "A one-day workshop for small business owners. You already use AI to write emails. Today you will use it to build something your company can actually keep and run.",
    gold: "Find the work that is wasting your time. Then make a first version that runs on your laptop.",
    meta: "Doors 8:30  ·  Program 9:00-5:00  ·  Stay-and-finish 5:00-5:30\n$1,200-$1,500  ·  twelve seats  ·  lunch  ·  14-day follow-up call",
    notes: "Lids down for Block 1. This is not a 12-tools tour."
  },
  {
    id: "agenda", n: 2, layout: "agenda", kicker: "00  ·  Today at a glance", title: "The day",
    headers: ["Time", "What we do", "How"],
    rows: [
      ["8:30-9:00", "Get set up (laptops and accounts)", "Help at your table"],
      ["9:00-10:15", "1. What you can actually do now", "Talk + short demo"],
      ["10:30-12:00", "2. Find your problem, then write it down", "Worksheet + laptop"],
      ["12:00-1:00", "Lunch", "Help for anyone still stuck"],
      ["1:00-2:45", "3. Build the first version", "We demo, then you build"],
      ["3:00-4:15", "4. Make it useful", "Keep building"],
      ["4:15-5:00", "5. How to keep going after today", "Share + plan"],
      ["5:00-5:30", "Stay if you are close", "One more fix"]
    ],
    notes: "Do not steal the breaks. Labs fail if you do."
  },
  {
    id: "rules", n: 3, layout: "list", kicker: "00  ·  House rules", title: "How we will spend eight hours",
    items: [
      { n: "01", t: "Laptops closed at first", d: "The opening talk only works if we are looking at the room, not a chat window." },
      { n: "02", t: "No real customer secrets", d: "Use fake names and fake numbers. Never paste passwords or live client lists." },
      { n: "03", t: "One problem, not a whole company", d: "We will pick one annoying job. Not a giant rebuild." },
      { n: "04", t: "You drive", d: "You talk to the AI. Staff will not take over your keyboard." },
      { n: "05", t: "Ugly and running beats pretty and imaginary", d: "A simple thing that works on this laptop is a win." }
    ],
    notes: "Read the five rules. Then intro later, not now."
  },
  {
    id: "is-not", n: 4, layout: "split", kicker: "00  ·  What this day is", title: "Not a class in 12 AI tools.",
    left: { h: "This day is", ps: ["We change what you think is possible, then we find a real problem in your business, then you build a first version.", "Your company, not a practice dataset. One short written brief. An AI that can use your files, not just a chat website.", "You leave with files on your laptop. They are yours."] },
    right: { h: "This day is not", ps: ["A tour of 12 apps, or ChatGPT 101.", "A coding class. You will not learn JavaScript.", "A sales demo of our software. If you want help after today, that conversation is at the end, after you have built something."] },
    notes: "Cortex is not this day. Stewardship is the last door."
  },
  {
    id: "ceilings", n: 5, layout: "split", kicker: "01  ·  The shift", title: "Two different uses of AI",
    left: { h: "What most people were sold", ps: ["A chat box. Draft the email. Summarize the PDF. Ask questions.", "Like a clever intern with no memory, who cannot open your folders or change your website."] },
    right: { h: "What you can do now", ps: ["An AI that can see a folder on your computer, write a small program or page, run it, hit an error, and try again.", "You stay in charge. You know how the shop works. You tell it what right looks like."] },
    notes: "Chat answers. A harness acts. Hold for the 3-minute contrast. Define harness in speech: the app that can edit files and run things."
  },
  {
    id: "corps", n: 6, layout: "table", kicker: "01  ·  The shift", title: "What big companies paid programmers for",
    sub: "Not genius. A budget. You were told only huge companies get this.",
    headers: ["What they built", "In plain words", "What that looks like for you now"],
    rows: [
      ["Internal tools", "Software that matches how we actually work", "Your quoting sheet becomes a simple app"],
      ["Custom websites", "A site they can change without a ticket", "A page you can update without a $2,000 invoice"],
      ["Connectors", "Programs that talk so people don't retype", "A bridge between the form, the folder, and the books"],
      ["No more human copy-paste", "A person is not the link between two tools", "Maria stops retyping the same job"],
      ["A backup plan with vendors", "We might build it ourselves", "A real alternative to the next monthly bill"]
    ],
    notes: "Human API = glue work between tools. Say that out loud."
  },
  {
    id: "bottleneck", n: 7, layout: "title", kicker: "01  ·  The shift",
    title: "The hard part used to be hiring programmers.",
    sub: "You already know how quoting, jobs, and customers work. That was always the valuable part.\n\nWhat was expensive was paying people to turn those rules into software. That part got a lot cheaper. You can direct it from a laptop, by the month.",
    notes: "Do not become a programmer. Become a director."
  },
  {
    id: "sentence", n: 8, layout: "quote", kicker: "01  ·  The shift", kickerLine: "The one idea to keep",
    title: "You do not need to become a programmer.\nYou need to give clear instructions to a machine that can program.",
    sub: "Spot the wasted work. Write it down in plain English. Look at the result like an owner. Change what is wrong. Repeat.",
    notes: "Repeat once. Then the three doors."
  },
  {
    id: "doors", n: 9, layout: "cards-3", kicker: "01  ·  Three kinds of problems",
    title: "You cannot ask for help with a problem you cannot see yet.",
    cards: [
      { n: "01", h: "Stop renting the important part", p: "You pay monthly for a tool that almost fits. Keep payroll and credit cards. Build the quoting page, the intake form, or the job sheet yourself." },
      { n: "02", h: "Connect tools that don't talk", p: "The website form sits in email. Photos die on a phone. You do not have to switch platforms. You need a small bridge in between." },
      { n: "03", h: "Stop being the copy-paste", p: "Someone, often you, retypes the same job from email to spreadsheet to the paid tool. That is glue work. Encode the rule. Leave people for judgment." }
    ],
    notes: "Do not lock a build target yet. Human API = copy-paste person."
  },
  {
    id: "saas", n: 10, layout: "list", kicker: "01  ·  Subscriptions", title: "Door 1, stop renting the important part",
    sub: "You do not have to throw out QuickBooks today. You can stop paying monthly for a scheduler that cannot do how you actually schedule.",
    items: [
      { n: "RENT", t: "Keep paying for", d: "The boring rails: payroll, card processing, email." },
      { n: "OWN", t: "Make yourself", d: "The part that is your margin: how you quote, the job packet, the site you are afraid to touch." },
      { n: "NOW", t: "Today", d: "One page that does the 10% you actually use. No accounts. No vendor ticket." }
    ],
    notes: "Replace SaaS waste. Keep commodity rails."
  },
  {
    id: "glue", n: 11, layout: "flow-3", kicker: "01  ·  Connecting tools", title: "Door 2, a small bridge between two programs",
    sub: "The website form sits in an inbox. Stripe is not the job folder. Photos die on a phone. You think that means switch platforms. It often means a thin layer you own in between.",
    boxes: ["From (a tool you already pay for)", "A person in the middle", "To (the next tool)"],
    notes: "Let humans do human work. Automate handoffs."
  },
  {
    id: "human-api", n: 12, layout: "list", kicker: "01  ·  Copy-paste work", title: "Door 3, stop being the link between two programs",
    sub: "A person is doing the job a small program should do. The owner, the office manager, Maria. Not a job title. Glue work.",
    items: [
      "Retype the job from email to spreadsheet to the paid tool",
      "Send it to me and I will put it in the system",
      "Every Friday: download a file, clean it, upload it somewhere else",
      "Three tabs open, copy, paste, copy, paste",
      "The business stops when that person is on vacation"
    ],
    notes: "Everyone has a Maria. Sometimes Maria is them."
  },
  {
    id: "harness-vs", n: 13, layout: "table", kicker: "01  ·  Chat vs the real workplace", title: "A chat box answers. The right app can actually do the work.",
    headers: ["", "Chat website", "The app that can use your files"],
    rows: [
      ["Sees your files?", "Only what you paste", "Yes, the folder"],
      ["Can it run the thing?", "No. It gives you homework.", "Yes. You get a page or a file."],
      ["Where does it remember?", "The tab", "The files on your computer"],
      ["When it fails", "You start over", "You paste the error and it tries again"],
      ["What you keep", "A conversation", "A project you can open on Monday"],
      ["Examples", "The chatbot tab", "Claude Code, Grok Build, ChatGPT/Codex, Cursor"]
    ],
    notes: "Say harness once: that is the name for this kind of app. Then do the 3-minute contrast."
  },
  {
    id: "guess", n: 14, layout: "title", kicker: "01  ·  First guess",
    title: "Introductions. First guess only.",
    sub: "Name. Business in five words. One place a human still copies, retypes, or waits on a vendor.\n\nAfter the break we will decide if that is even the right problem. Do not lock in what you will build yet.",
    notes: "Write first guesses on the board. Do not workshop on stage."
  },
  {
    id: "break1", n: 15, layout: "title", kicker: "Break",
    title: "15 minutes.",
    sub: "When we come back: walk through one real job. Find the wasted work. Then write it down.",
    notes: "Hard stop. Do not eat Lab 0."
  },
  {
    id: "lab0", n: 16, layout: "list", kicker: "02  ·  Find the wasted work", title: "Worksheet: walk one real job",
    sub: "This 30 minutes is what the ticket is for. Staff sit with you. Do not open the AI app yet.",
    items: [
      { n: "1", d: "Pick one recent job, from first contact to paid (or you gave up)." },
      { n: "2", d: "Mark every H: copied, retyped, forwarded, exported, waited." },
      { n: "3", d: "Who is the copy-paste person? Which monthly tools would you keep for only one feature?" },
      { n: "4", d: "Which two tools do not talk, so a person talks for them?" },
      { n: "5", d: "Circle one sentence for today: we will turn this into that." }
    ],
    notes: "Five minutes per owner. Write the sentence for them if they hesitate."
  },
  {
    id: "pick", n: 17, layout: "cards-3", kicker: "02  ·  Choose one", title: "How to pick what to build today",
    cards: [
      { n: "01", h: "It hurts", p: "It costs money, time, mistakes, or embarrassment." },
      { n: "02", h: "It fits in an afternoon", p: "One person, one job, you can see the result, no live logins." },
      { n: "03", h: "You would own it", p: "If we finish, do you hold files on your machine, or still rent the tool?" }
    ],
    sub: "Connecting live QuickBooks is Monday. Turning a fake spreadsheet into a job sheet is today.",
    notes: "Score, then pick. One problem."
  },
  {
    id: "build-today", n: 18, layout: "list", kicker: "02  ·  Today's sentence", title: "Write one sentence: we will turn this into that.",
    items: [
      { n: "GOOD", d: "Turn a pasted inquiry email into a one-page job packet I can print." },
      { n: "GOOD", d: "Replace the $89/mo intake form with a page that uses our actual questions." },
      { n: "GOOD", d: "Take the weekly file I download and produce the spreadsheet I currently retype." },
      { n: "BAD", t: "Too big", d: "Make the business run on AI. / A new app for everything." }
    ],
    notes: "That sentence becomes brief section 3."
  },
  {
    id: "anatomy", n: 19, layout: "list", kicker: "02  ·  The app you brought", title: "What the AI on your laptop actually is",
    sub: "People call this a harness. Plain version: an AI that can use a folder on your computer, not just a chat tab.",
    items: [
      { n: "01", t: "Folder", d: "This is the workbench. If it is not in the folder, it does not exist." },
      { n: "02", t: "Brief", d: "Your one-page instructions. Write them first. Always." },
      { n: "03", t: "The AI", d: "A fast helper with no memory of your prices unless you put them in the brief." },
      { n: "04", t: "Run it", d: "Open the page or file it made. Look at it." },
      { n: "05", t: "Errors", d: "Not a verdict on you. Paste the error back. It tries again." }
    ],
    notes: "This is the workplace, not chat."
  },
  {
    id: "safety", n: 20, layout: "list", kicker: "02  ·  Safety", title: "Never paste these",
    items: [
      "Passwords, API keys, bank logins, wifi passwords",
      "Full client lists, student lists, patient lists",
      "SSNs, card numbers, medical details",
      "Your live website, live store, or live QuickBooks",
      "Here is our whole Drive folder of live operations"
    ],
    notes: "Physical safety card on the laptop."
  },
  {
    id: "spec", n: 21, layout: "spec", kicker: "02  ·  The one-page brief", title: "One page of instructions, same format all day",
    cells: [
      { n: "1 Business", p: "Who we are. Who we are not." },
      { n: "2 Who uses it today", p: "Usually: me, the owner. Not everyone." },
      { n: "3 The job", p: "Today's sentence. We will turn this into that." },
      { n: "4 How it works now", p: "The messy truth. Who currently copies the data." },
      { n: "5 Done for today", p: "I know it worked when I can click through it. No login. No payments." },
      { n: "6 Rules it must not invent", p: "Minimums, things we refuse, tax, who can discount." },
      { n: "7 How it should look", p: "Plain shop document. Not a startup." },
      { n: "8 Privacy", p: "Fake or redacted names in this room." }
    ],
    notes: "Section 3 is the circled sentence. Stop before building the app."
  },
  {
    id: "lab1", n: 22, layout: "title", kicker: "02  ·  Lab 1",
    title: "Write the brief. Do not build the thing yet.",
    sub: "Make a folder on the desktop. Put your one-page instructions in SPEC.md. Then say:\n\nRead SPEC.md. Write README.md in plain language for me, the owner. Do not write the app yet.\n\nYou are done when the README sounds like your shop.",
    notes: "A file before lunch."
  },
  {
    id: "lunch", n: 23, layout: "title", kicker: "Lunch",
    title: "Lunch. 12:00-1:00.",
    sub: "If your laptop is still stuck, sit at the back table. We will pick the live demo from your sentences: a quote page, or a job packet from a spreadsheet.",
    notes: "Staff eat in shifts."
  },
  {
    id: "live", n: 24, layout: "list", kicker: "03  ·  Live demo", title: "Watch one real problem become a running page",
    items: [
      { n: "A", t: "Copy-paste / connecting tools", d: "Paste a fake spreadsheet. Get printable job packets. Site visit line always. Roofing: we don't do this." },
      { n: "B", t: "Quoting / the rented tool", d: "Pick a job type, enter a quantity, add the site visit, see the math and the total." }
    ],
    notes: "Narrate: I am not chatting. I am handing a brief. Stop when it runs."
  },
  {
    id: "dft", n: 25, layout: "list", kicker: "03  ·  Done for today", title: "Done for today means",
    items: [
      "One user (usually you).",
      "One job (quote, intake, track, or connect two steps).",
      "It runs on this laptop.",
      "Your real business rule is visible (the minimum, the fee, the refusal).",
      "No accounts, no payments, no live logins, no and also."
    ],
    notes: "Leave this up all afternoon."
  },
  {
    id: "lab2", n: 26, layout: "title", kicker: "03  ·  Lab 2",
    title: "Build the one thing you circled.",
    sub: "Read SPEC.md. Build the smallest thing that finishes Done for today. No login, no payments, no live connections. If this is a bridge between tools, a page where you paste a redacted file is enough. When it runs, tell me how to open it. Then stop.\n\nLook at it like an owner: Can I do the job? Is the number how we actually work? What extra stuff did it invent? Delete that first.",
    notes: "Roam. Brief first. Do not grab the keyboard unless stuck 10 minutes."
  },
  {
    id: "paths", n: 27, layout: "cards-3", kicker: "04  ·  Make it useful", title: "Pick one next step. Not both.",
    cards: [
      { n: "Path A", h: "Make this one truer", p: "Add the rule you skipped. Save and load. The next hop of the copy-paste.", hot: true },
      { n: "Path B", h: "A page a customer could see", p: "Only if that is the actual problem. An intake form or a simple page. Still no payments." },
      { n: "Path C", h: "Use our starter", p: "Quote calculator or spreadsheet-to-packet. Change the name and one rule so it is yours." }
    ],
    notes: "Hands for paths. Cluster staff on C and reds."
  },
  {
    id: "replaces", n: 28, layout: "quote", kicker: "04  ·  Write it down", kickerLine: "One sentence",
    title: "This replaces ________.",
    sub: "Screenshot the main screen. Finish the sentence. Ninety seconds.",
    notes: "Collect sentences. These are the close stories."
  },
  {
    id: "cadence", n: 29, layout: "list", kicker: "05  ·  The next 30 days", title: "Monday is where workshops die. Put this on your calendar now.",
    items: [
      { n: "W1", t: "Week 1", d: "Open it again. Change one real number or rule. Screenshot before and after." },
      { n: "W2", t: "Week 2", d: "Write the next problem on paper. Do not start it until week 1 still runs." },
      { n: "W3", t: "Week 3", d: "Look at one subscription: keep, cancel, or replace with what you built." },
      { n: "W4", t: "Week 4", d: "Show one other person. If you cannot explain it, the brief is not done." }
    ],
    notes: "Fill the sheet in the room."
  },
  {
    id: "own-rent", n: 30, layout: "split", kicker: "05  ·  Own vs rent", title: "What to keep renting. What to own.",
    left: { h: "Keep renting", ps: ["Email. Payroll. Taking credit cards. Bookkeeping if you like your bookkeeper. The boring pipes everyone uses."] },
    right: { h: "Own this", ps: ["How you quote. How a job moves. The site you are afraid to touch. The spreadsheet that is the company. The copy-paste between tools you already pay for."] },
    notes: "If today replaced one of those, the ticket already returned."
  },
  {
    id: "steward", n: 31, layout: "close", kicker: "05  ·  If you want help after today",
    title: "You can keep going alone.",
    sub: "You just did this with an AI app on a laptop you already pay for. That is enough to start.\n\nSome of you will hit a wall that is not skill: client files you do not want in a public AI, a team that needs sign-off, or a setup you do not want to babysit when the tools change.\n\nThat is a keeping-it-running problem. That is what Carapace is for. Cortex is the software layer. The next conversation is a Discovery Sprint.\n\nThere is no obligation. This day was you, not us.",
    notes: "Under 10 minutes. Do not demo Cortex. Sit down."
  },
  {
    id: "end", n: 32, layout: "title", kicker: "Close",
    title: "You were sold a chatbot.\nYou ran a small software shop for an afternoon.",
    gold: "Carapace  ·  You Can Build It Now",
    sub: "The files are on your machine. Fill the 30-day plan before you stand up. Stay until 5:30 if you are one error away.",
    notes: "Office hours. Screenshot the board if they consent."
  }
];
