/**
 * The Westercove book catalog, ported verbatim from the Lovable demo's
 * `src/lib/content.ts`. Summaries and guidance are product copy written for the
 * brand voice (no em dashes, no "closure" or "journey"), not filler, so they
 * should be edited with the same care as any other user-facing string.
 */

export type BookModule = 'pet' | 'human';

export type Book = {
  id: string;
  title: string;
  author: string;
  cover: string; // hex background
  accent: string;
  summary: string;
  module: BookModule; // which loss path this book belongs to
};

const PET_BOOKS: Omit<Book, 'module'>[] = [
  {
    id: 'loss-of-a-pet',
    title: 'The Loss of a Pet',
    author: 'Wallace Sife',
    cover: '#26114E',
    accent: '#EDC531',
    summary:
      "For more than thirty years this book has been a steady reference for people grieving a companion animal, and it is often recommended by veterinarians and grief counselors who want something trustworthy to put in a mourner's hands. Wallace Sife writes with both clinical care and personal warmth, and he treats the death of a pet as real grief that deserves to be met honestly. He speaks to the emotional weight that follows losing an animal you loved, the sorrow, the guilt that so many people carry, the loneliness of a house that has gone quiet. He does not rush the reader toward feeling better, and he does not shrink the loss to make others comfortable. Instead he offers understanding for the many feelings that can arrive at once, and reassurance that they are a normal part of loving an animal and losing them. The book speaks to anyone whose dog, cat, or other beloved companion has died, and to those still bracing for a loss they know is coming. It is gentle company for the long middle of grief, when the first shock has faded but the missing has not. Readers who feel their sorrow has been dismissed by others often find here the recognition they were looking for, and quiet permission to grieve fully and without apology.",
  },
  {
    id: 'goodbye-friend',
    title: 'Goodbye, Friend',
    author: 'Gary Kowalski',
    cover: '#0E5F18',
    accent: '#F6F1E7',
    summary:
      "Warm, compassionate, and easy to read, this is one of the most widely recommended books for people mourning an animal who has died. Gary Kowalski writes gently, with a reverence for the bond between people and their companions, and he takes that bond completely seriously rather than treating pet grief as a smaller kind of sorrow. He offers comfort for the raw early days and for the quieter ache that lingers after, and he suggests small rituals and ways of remembering that can help give the loss a place to rest. Much of the book is about honoring the animal you loved, marking their life in ways that feel true to you, and finding language for what to say to yourself when the house feels empty. Kowalski's tone is unhurried and kind, never pushing you toward feeling better on anyone else's schedule. The book suits anyone whose dog, cat, or other animal has died, whether the loss is fresh or years old, and it is especially gentle for readers who feel a little lost about how to grieve or how to keep their companion's memory close. It reads almost like sitting with a thoughtful friend who understands that losing an animal can break your heart, and who wants only to keep you company while it slowly heals.",
  },
  {
    id: 'pet-loss-companion',
    title: 'The Pet Loss Companion',
    author: 'Ken Dolan Del Vecchio and Nancy Saxton Lopez',
    cover: '#338233',
    accent: '#26114E',
    summary:
      "Written by experienced grief therapists who have led pet-loss support groups, this book offers practical, grounded guidance for the ordinary hard moments that come after an animal dies. The authors understand that grief lives in small daily things, the empty leash by the door, the food bowl you keep almost filling out of habit, the quiet of a house that used to have a living presence in it. They take pet grief completely seriously and never treat it as a lesser loss. Alongside their compassion they offer concrete tools, ways to steady yourself through a wave of sorrow, ways to answer the well-meaning comments of people who did not know your animal and cannot understand what has been lost. They also make room for the guilt and second-guessing that so often follow, especially when hard end-of-life decisions were involved. The book speaks to anyone grieving a beloved companion, and it is particularly helpful for people who want gentle, usable support rather than theory. Because it draws on the authors' work with real grieving people, it feels practiced and reassuring, like guidance from someone who has sat with many mourners and knows the shape this sorrow takes. It is a kind, steadying companion for the long stretch of missing an animal you loved.",
  },
  {
    id: 'grieving-death-of-pet',
    title: 'Grieving the Death of a Pet',
    author: 'Betty J. Carmack',
    cover: '#190933',
    accent: '#EDC531',
    summary:
      "Written by a grief counselor with long experience supporting people after the death of a companion animal, this book helps readers understand the emotional weight of the loss and gives language for feelings they may have thought they were not allowed to have. Betty Carmack takes the bond between people and animals seriously, and she honors the depth of grief that can follow when a beloved dog, cat, or other companion dies. She makes room for the sorrow, the guilt, the anger, and the loneliness that grief can bring, and she reassures the reader that such feelings are a normal part of having loved deeply. Rather than hurrying anyone toward feeling better, she offers understanding and a sense of being accompanied. The book is gentle company for people who feel their grief has been minimized by others, and for anyone surprised by how heavily the loss has landed. It speaks to the quiet ache of an empty home and to the tender work of remembering. Readers often find here the recognition they were missing, a steady voice telling them that this grief is real and deserved. For those who want to feel understood rather than instructed, Carmack's compassion and her respect for the human-animal bond make this a comforting and validating book to keep close.",
  },
  {
    id: 'saying-goodbye',
    title: 'Saying Goodbye to the Pet You Love',
    author: 'Lorri A. Greene, PhD',
    cover: '#EDC531',
    accent: '#26114E',
    summary:
      "This book offers steady, compassionate guidance through some of the hardest parts of loving a dying animal, including the anticipatory grief that comes when you know the loss is near, the weight of euthanasia decisions, and the healing that follows after a companion has died. Lorri Greene writes with a calm, understanding tone that pet owners and veterinary professionals have valued, and she treats these losses as real grief that deserves care. She understands how heavily end-of-life choices can sit on a person, and how easily guilt can take hold even when every decision was made out of love. Rather than rushing the reader, she offers reassurance and a sense of being accompanied through moments that can feel impossibly lonely. The book speaks to anyone facing the decline of a beloved animal, anyone carrying the ache of having had to say goodbye, and anyone struggling in the days and weeks after. It makes room for sorrow, doubt, and the tenderness that runs underneath them. For people who feel unsteady in the face of a coming loss, or who are trying to forgive themselves for a hard but loving choice, Greene's gentle steadiness can be a real comfort. It is a kind hand to hold through the caretaking, the goodbye, and the grief that follows.",
  },
  {
    id: 'grief-recovery-handbook',
    title: 'The Grief Recovery Handbook for Pet Loss',
    author: 'Russell Friedman and Cole James',
    cover: '#0E5F18',
    accent: '#EDC531',
    summary:
      "This book brings the Grief Recovery Method to the specific sorrow of losing a companion animal, offering a practical, action-oriented path for people who want to do something with their pain rather than only sit inside it. The authors understand that pet grief is real grief, and they refuse to treat the death of a beloved animal as a smaller kind of loss. Their approach is gentle but structured, built around the idea that grief can be actively worked through with honesty and small, deliberate steps. They make room for the things left unsaid, the thank-yous, the apologies, the quiet I-love-yous that people often wish they had spoken, and they help the reader find ways to give those feelings expression. The book speaks to anyone who feels stuck in the aftermath of losing a dog, cat, or other animal, and especially to people who find comfort in doing rather than waiting. It takes seriously the guilt and regret that so often accompany a pet's death, and it offers a way to move gently rather than pushing the grief aside. For readers who want a clear, doable framework and a sense that their effort is leading somewhere, this steady, compassionate guide can help them carry the loss with more tenderness toward themselves and their animal.",
  },
  {
    id: 'book-of-pet-love-loss',
    title: 'The Book of Pet Love and Loss',
    author: 'Sara Bader',
    cover: '#26114E',
    accent: '#F6F1E7',
    summary:
      'This is a gentle collection of quotations, reflections, and short pieces gathered to honor the bond between people and the animals they love. Sara Bader brings together voices from across time who have written about companionship, devotion, and the sorrow of losing an animal, and the result is a book you can open at random on a hard evening rather than read straight through. For someone grieving a companion who has died, there is real comfort in finding your own feelings already put into words by others who have loved and lost an animal. The book takes pet grief seriously and treats it as worthy of the same tenderness given to any deep loss. It suits people who find that a single passage can steady them when a whole chapter feels like too much, and those who want to keep beautiful, true-feeling words close at hand. You might collect the lines that fit your own animal, or read one aloud to yourself or to them. Because it is drawn from many voices rather than a single argument, it never pushes you toward feeling any particular way. Instead it keeps you company, offering language for love and grief when your own words are hard to find, and reminding you that others have carried this same ache and honored it well.',
  },
  {
    id: 'griffins-heart',
    title: "Griffin's Heart",
    author: 'Reagan M. Sommers',
    cover: '#338233',
    accent: '#F6F1E7',
    summary:
      "This book speaks directly to people who feel they must apologize for how much the death of their animal has hurt, and it gently insists that pet grief is legitimate and deserves no shame. Reagan Sommers offers a steady counterweight to the voices, spoken or implied, that say it was just an animal, and instead affirms that the grief is the size of the love. For anyone who has felt dismissed or misunderstood after losing a beloved companion, the book can feel like being seen at last. It makes room for the full weight of the sorrow, the loneliness of a changed home, and the ache of missing a presence that was woven into daily life. Rather than rushing the reader toward feeling better, it honors the depth of the bond and the realness of the loss. The book suits people whose grief has been minimized by others, and those who need permission to mourn openly and without defending themselves. Its tone is compassionate and affirming, the kind of company that lets you stop bracing against the world's judgment and simply feel what you feel. For readers who have been carrying their sorrow quietly, unsure whether they are allowed to grieve so much for an animal, this book offers a clear and kind answer that they are.",
  },
  {
    id: 'repairing-heartbreak',
    title: 'Repairing the Heartbreak of Pet Loss Grief',
    author: 'C. Jeffrey',
    cover: '#190933',
    accent: '#EDC531',
    summary:
      'This has become a well-liked resource in online pet-loss communities for its practical, gentle approach to healing after a companion animal has died. It is small and structured, built around exercises a grieving person can work through slowly, at their own pace, rather than a long book to read all at once. The author understands that pet grief is real grief and treats the loss of a beloved animal with the seriousness it deserves. Rather than offering only sympathy, the book gives the reader something to do, small steps that can help move gently through the heaviest feelings without forcing anyone to hurry. It makes room for guilt, sorrow, and the disorientation that can follow when a daily companion is suddenly gone, and it encourages noticing gentle changes over weeks rather than measuring yourself against days. The book suits people who find comfort in a clear, doable practice, and who want to feel they are tending their grief rather than only enduring it. Because it asks for just a little at a time, it can feel manageable even when everything else feels like too much. For readers who want a kind, hands-on guide to carry them through the early weeks and months of missing their animal, this steady little book offers structure, reassurance, and permission to heal slowly.',
  },
  {
    id: 'honoring-our-animals',
    title: 'Honoring Our Animals',
    author: 'Beth Bigler',
    cover: '#0E5F18',
    accent: '#EDC531',
    summary:
      'Written by a pet-grief counselor, this book centers on honoring the relationship you shared with your animal and finding meaning in the aftermath of their death. Beth Bigler takes pet grief completely seriously, and rather than pushing the reader toward getting over the loss, she encourages carrying the bond forward with tenderness. The book offers gentle prompts for remembering, ideas for marking the life of a beloved companion, and a compassionate frame for the many feelings that grief can bring. It makes room for sorrow and guilt while keeping the focus on love, on all the ways an animal shaped your days and your heart. For people who worry that continuing to feel connected means they are holding on too long, Bigler offers reassurance that honoring the relationship is not a failure to heal but a way of carrying it well. The book suits anyone whose dog, cat, or other companion has died, and especially those who want to find purpose or meaning in how they remember. It can help with the hardest dates and anniversaries, offering small honoring practices that keep the animal present in daily life. Warm and thoughtful throughout, it treats the human-animal bond as something worth cherishing and grief as an expression of that love, deserving of care rather than dismissal.',
  },
];

const HUMAN_BOOKS: Omit<Book, 'module'>[] = [
  {
    id: 'letters-to-grief',
    title: 'Letters to Grief',
    author: 'Kate Motaung',
    cover: '#26114E',
    accent: '#EDC531',
    summary:
      'This is a short and honest book made up of letters written directly to grief itself, as though grief were someone the author could speak to plainly rather than something to avoid. Kate Motaung gives words to the anger, the exhaustion, and the tenderness that grief carries, and in doing so she shows that sorrow can be addressed honestly instead of pushed down. Because the book is brief and made of short pieces, it is manageable even on days when concentration is thin and everything feels heavy. Motaung does not offer neat answers or hurry the reader toward feeling better. Instead she models what it looks like to be truthful about pain, to name it, argue with it, and sit beside it. The book suits anyone carrying a loss that words have failed to capture, and it can be especially freeing for people who have felt they must stay composed or grateful when what they really feel is raw. Reading someone else speak so frankly to their own grief can loosen something in a reader who has been holding everything in. It gives quiet permission to be honest, and it reassures you that you are not trying to reach an ending, only to tell the truth about what the loss has been. For that honesty, many grieving readers find it a real comfort.',
  },
  {
    id: 'navigating-intense-grief',
    title: 'Navigating Intense Grief',
    author: 'Emily Vandenberg',
    cover: '#0E5F18',
    accent: '#F6F1E7',
    summary:
      "This is a steadying guide for the days when grief feels physically overwhelming, when sorrow lands in the body and the ordinary hours become hard to move through. Emily Vandenberg writes in a practical, calm way, meeting the reader in the most difficult stretches rather than offering distant comfort. She understands that grief is not only an emotion but something that can flood the whole self, making it hard to sleep, eat, or think, and she offers grounded help for getting through the hardest hours without expecting yourself to feel better on any schedule. The book makes room for the intensity of loss without treating it as something wrong, and it gently lowers the bar on the worst days to one small, doable thing. It suits anyone in the acute stretch of grief, the early weeks and months after a death when the pain can feel unbearable, and it is especially helpful for people who feel frightened by how strong their grief has become. Vandenberg's tone is reassuring and unhurried, the kind of steady presence that reminds you a wave of grief will crest and pass even when it feels like it will not. For readers who need practical, compassionate footing in the middle of overwhelming sorrow, this book offers calm, usable guidance and the reassurance that they are not falling apart, only grieving.",
  },
  {
    id: 'shattered-surviving-loss-child',
    title: 'Shattered: Surviving the Loss of a Child',
    author: 'Gary Roe',
    cover: '#338233',
    accent: '#F6F1E7',
    summary:
      "Written for parents after the death of a child, this book meets one of the hardest losses a person can know with unflinching gentleness. Gary Roe writes from deep experience accompanying the bereaved, and he never rushes the reader toward feeling okay or offers easy reassurance where none exists. Instead he sits with the enormity of losing a child, the disbelief, the anguish, the way such a loss can unmake a person's sense of the world. He gives grieving parents language for feelings that can seem too large to hold, and he reassures them that whatever they feel is a normal response to something that should never have to be borne. The book makes room for guilt, anger, and the long disorientation that follows, and it does so with tenderness rather than instruction. It suits any parent grieving a child, whether the loss is recent or years past, and it can also help those who love and want to support a bereaved parent understand the depth of what they are carrying. Roe's voice is compassionate and patient, the voice of someone who has walked beside many grieving people and knows there are no shortcuts. For parents who feel shattered by their loss, this book offers company in the wreckage and a quiet, steady assurance that they are not alone in it.",
  },
  {
    id: 'grief-recovery-handbook-workbook',
    title: 'The Grief Recovery Handbook Workbook',
    author: 'John W. James and Russell Friedman',
    cover: '#190933',
    accent: '#EDC531',
    summary:
      'This is the companion workbook to the Grief Recovery Method, offering structured exercises for people who would rather actively work through a loss than wait for time alone to ease it. James and Friedman built their approach on the idea that grief is the normal response to loss and that it can be addressed with honesty and deliberate steps rather than left to sit unexamined. The workbook guides the reader through reflecting on an important relationship, noticing what they wish had been different and what they are grateful for, and finding ways to give voice to the things that were left unsaid. It is meant to be worked one exercise at a time, with room to pause and rest when the feelings become heavy. The book suits people who find comfort in doing rather than only feeling, and who want a clear framework to follow through the confusion that grief can bring. Because it is hands-on, it can help someone who feels stuck or unsure where to begin. It takes grief seriously as real and worthy of attention, and it never hurries the reader. For those who want practical structure and a sense that their effort is leading somewhere gentler, this workbook offers a steady, guided way to tend a loss with honesty and care for themselves.',
  },
  {
    id: 'fk-death-workbook',
    title: 'F**k Death Workbook',
    author: 'Steve Case',
    cover: '#EDC531',
    accent: '#26114E',
    summary:
      'This is a blunt and irreverent workbook for people who find polite grief language useless and even alienating. Steve Case makes room for anger and dark humor, the feelings that gentler books can leave a person feeling ashamed of, while still guiding real reflection about a loss. For readers who have gritted their teeth through soft euphemisms and well-meaning platitudes, the frankness here can be a relief, a permission to be as raw and profane on the page as the grief actually feels. The workbook takes loss seriously even as it refuses to be solemn about it, and its humor is not a way of avoiding pain but of surviving it. It offers prompts and exercises that let the reader put their honest, messy feelings into words, without any pressure to feel lighter or more composed than they do. The book suits people whose grief runs hot, who are furious at death and unwilling to pretend otherwise, and who want company that matches their bluntness rather than smoothing it over. It can be especially freeing for those who feel out of step with the quiet, reflective tone of most grief resources. For readers who need to swear at the unfairness of it all and still do meaningful reflection, this workbook meets them exactly where they are, honestly and without judgment.',
  },
  {
    id: 'imagine-heaven',
    title: 'Imagine Heaven',
    author: 'John Burke',
    cover: '#26114E',
    accent: '#EDC531',
    summary:
      'This book gathers and reflects on many near-death accounts, drawing them together to consider what they might suggest about what comes after death. John Burke writes for readers who find comfort in the possibility of more beyond this life, and he approaches the subject with a hopeful, faith-informed lens. For someone grieving, the ache of not knowing where a loved one has gone can be one of the heaviest parts of loss, and this book speaks gently to that longing. It does not demand certainty from the reader so much as invite them to stay open to the possibility that their person is at peace and that the bond is not simply ended. Burke treats the accounts he surveys with care, and he weaves them into a larger picture meant to console. The book suits people who hold or lean toward a spiritual or Christian frame, and who want to sit with hopeful questions about the afterlife rather than close them off. It can be a comfort in quiet moments when you wonder where someone you loved has gone. Read gently, it offers a picture of the beyond that some grieving readers find soothing, a way of imagining their person whole and unburdened. For those drawn to that hope, it can ease a little of the sorrow of not knowing.',
  },
  {
    id: 'the-broken-way',
    title: 'The Broken Way',
    author: 'Ann Voskamp',
    cover: '#0E5F18',
    accent: '#F6F1E7',
    summary:
      "This is a reflective, contemplative book about living with brokenness and finding meaning inside pain rather than only after it has passed. Ann Voskamp writes in a lyrical, faith-informed voice, and she does not pretend that suffering can be tidied away or explained. Instead she explores how a person can go on loving and living even while carrying real wounds, and how grace can be found in the midst of hurt rather than only on the far side of it. For a grieving reader, the book offers a way of holding sorrow and meaning together, letting one small kindness or moment of beauty sit alongside the pain without erasing it. Voskamp's approach is gentle and unhurried, more meditation than instruction, and it makes room for the reader who feels broken by loss and unsure how to keep going. The book suits people who find comfort in a Christian and contemplative frame, and who are drawn to reflection rather than practical steps. It can be a companion for the long, quiet work of living with a loss that does not simply resolve. For readers willing to sit with hard questions and look for grace inside them, Voskamp offers a tender, thoughtful voice and the reassurance that brokenness is something a person can carry, not something they must fix today.",
  },
  {
    id: 'survive-death-adult-child',
    title: 'How to Survive the Death of an Adult Child',
    author: 'G.M. Grace',
    cover: '#338233',
    accent: '#26114E',
    summary:
      'This book speaks to the particular grief of losing a grown child, a loss the world often struggles to acknowledge and does not always know how to comfort. When an adult child dies, parents can find that others assume the bond was somehow lesser because the child was no longer small, when in truth decades of shared life have been taken away. G.M. Grace meets that sorrow with compassion and practicality, offering understanding for the shock, the disorientation, and the long ache that follows. The book takes the loss completely seriously and makes room for the many feelings it brings, including guilt, anger, and the sense that the natural order has been broken. Rather than hurrying the reader toward feeling better, it accompanies them and reassures them that their grief is real and deserved. It suits any parent mourning a grown son or daughter, and it can help them feel less alone in a loss that others may not fully recognize. Practical and gentle by turns, it offers both comfort and small, usable footing for getting through the hardest stretches. For parents who feel their grief has been minimized or misunderstood, this book offers recognition, tenderness, and the steady assurance that losing an adult child is a profound loss worthy of deep and lasting mourning.',
  },
  {
    id: 'journey-of-souls',
    title: 'Journey of Souls: Case Studies of Life Between Lives',
    author: 'Michael Newton, PhD',
    cover: '#190933',
    accent: '#EDC531',
    summary:
      "This book presents case studies drawn from Michael Newton's work in regression, exploring ideas about what the soul may experience in the time between lives. It is written for readers who are open to a spiritual frame and who find comfort in the possibility that death is not a final ending. For someone grieving, the questions of where a loved one has gone and whether they are at peace can weigh heavily, and this book offers one imaginative picture that some people find soothing. Newton shares the accounts he gathered and the reasoning behind his approach, inviting the reader to consider a view of the soul as continuing beyond a single lifetime. The book suits those who lean toward metaphysical or spiritual ideas and who want to sit with hopeful possibilities rather than close them off. It does not ask to be taken as proof so much as offered as a perspective, and readers are free to take what comforts them and leave the rest. In grief, imagining a person you loved as whole and unburdened can ease a little of the sorrow of not knowing. For those drawn to that kind of reflection, this book offers a gentle, hopeful frame and a sense that the connection with someone who has died may not be as broken as it feels.",
  },
  {
    id: 'signs-secret-language',
    title: 'Signs: The Secret Language of the Universe',
    author: 'Laura Lynne Jackson',
    cover: '#EDC531',
    accent: '#26114E',
    summary:
      'This book is about the small signs that many grieving people notice and quietly wonder about, the unexpected moments that seem to carry meaning after someone we love has died. Laura Lynne Jackson invites readers to stay open to a felt sense of ongoing connection, and to let those moments be a source of comfort rather than something they must explain or prove. For someone in grief, the longing for any sense that a loved one is still near can be powerful, and this book gently affirms that longing rather than dismissing it. Jackson writes warmly and encouragingly, offering a frame in which noticing a sign becomes a moment of connection instead of a puzzle to solve. The book suits people who are drawn to a spiritual or intuitive view of loss, and who find that their grief is eased by staying open to the possibility that the bond continues in some quiet way. It does not demand belief so much as extend an invitation, and readers can take what brings them peace and set aside the rest. Many grieving people find real solace in the idea that connection does not simply end. For those who have noticed such moments and wondered what to make of them, this book offers a gentle, reassuring companion and permission to hold onto the comfort they bring.',
  },
  {
    id: 'bearing-the-unbearable',
    title: 'Bearing the Unbearable: Love, Loss, and the Heartbreaking Path of Grief',
    author: 'Joanne Cacciatore, PhD',
    cover: '#26114E',
    accent: '#F6F1E7',
    summary:
      'This is a tender and widely loved book by a grief researcher who is also a bereaved mother, and both kinds of knowledge run through every page. Joanne Cacciatore honors love and loss as inseparable, refusing the easy comforts that so often fall flat, and instead sitting honestly with the depth of what grief asks a person to bear. Written in short reflections, the book is manageable even on days when concentration is thin, and each piece meets the reader with compassion rather than instruction. Cacciatore does not tell anyone how quickly to heal or push them toward getting over a loss. She understands that profound grief comes from profound love, and she treats sorrow as a form of devotion rather than a problem to solve. The book speaks to anyone carrying a heavy loss, and it is especially meaningful for those who have been told, however gently, that they should be further along than they are. Its voice is warm, wise, and unflinching, the voice of someone who has both studied grief and lived it. It encourages the reader to be as kind to themselves as they would be to a grieving friend. For people who want to feel understood at the deepest level, and to have their love and their loss honored together, this book offers rare and lasting comfort.',
  },
  {
    id: 'i-wasnt-ready-to-say-goodbye',
    title: "I Wasn't Ready to Say Goodbye",
    author: 'Brook Noel and Pamela D. Blair, PhD',
    cover: '#0E5F18',
    accent: '#EDC531',
    summary:
      'This is a practical and compassionate guide for people facing sudden and unexpected death, when there was no chance to prepare and no time to say goodbye. Brook Noel and Pamela Blair understand the particular shock of a loss that arrives without warning, and they meet the reader in the disorientation of the earliest days as well as the long middle that follows. The book takes seriously how overwhelming those first hours and weeks can be, and it gently encourages focusing only on the next necessary thing when everything feels like too much. It makes room for the many feelings that sudden loss can bring, the numbness, the guilt, the searching for reasons, and it reassures the reader that grief is uneven and that hard days are not a sign of failure. Both practical and warm, it offers usable footing alongside real understanding. The book suits anyone grieving a death that came suddenly, whether by accident, sudden illness, or other unexpected cause, and it can also help those supporting a newly bereaved person know what to expect. Its tone is steady and kind, the sort of companion you can return to as the shock slowly gives way to the longer work of grief. For people knocked sideways by a loss they never saw coming, this book offers grounding, recognition, and gentle, honest company.',
  },
  {
    id: 'healing-after-loss',
    title: 'Healing After Loss',
    author: 'Martha W. Hickman',
    cover: '#338233',
    accent: '#F6F1E7',
    summary:
      "This is a daily book of short meditations for the bereaved, offering one small page of comfort at a time. Martha Hickman gathers gentle reflections meant to be read slowly, a single passage in the morning to carry a grieving person into the day. For someone in the thick of loss, when a whole book can feel like far too much, the brevity here is a kindness, asking only a few quiet minutes and giving something steadying in return. Each entry offers a thought to sit with, a bit of language for feelings that are hard to name, and a sense of not being alone in them. The book does not push the reader toward feeling better or measure their grief against any timeline. Instead it lets each day stand on its own, meeting whatever the reader is carrying that morning. It suits people who want small, reliable company through a long stretch of grief, and who find comfort in a gentle daily rhythm. Because it can be opened to the day's date or read at random, it becomes a quiet habit, a steady presence returned to again and again. For anyone who wants something soft and manageable to hold each morning, a few honest words to lean on, this book offers faithful, patient companionship through the slow work of healing.",
  },
  {
    id: 'when-grown-kids-disappoint',
    title: 'When Our Grown Kids Disappoint Us',
    author: 'Jane Adams',
    cover: '#190933',
    accent: '#EDC531',
    summary:
      "This book speaks to the quiet grief and worry that can come when adult children's lives take hard turns, a sorrow that is not death but still aches. Jane Adams writes for parents who love their grown sons and daughters and who find themselves mourning hopes they once held, or living with ongoing concern for a child who is struggling. It is a loss that others rarely recognize, because the person is still living, yet the disappointment, helplessness, and grief can be very real. Adams meets that experience with understanding, helping parents name what they are grieving even when the relationship continues. She encourages separating what a parent can influence from what they cannot, and grieving the difference rather than carrying endless guilt or trying to control the uncontrollable. The book suits parents of adult children who feel a private ache they do not always have words for, and who need permission to grieve a living loss without shame. Its tone is compassionate and practical, offering both recognition and gentle guidance for holding love and disappointment at the same time. For readers who thought grief was only for death, this book widens the definition kindly, affirming that mourning what you hoped for is real grief too. It offers steadying company for a sorrow that often goes unspoken.",
  },
  {
    id: 'heaven-is-for-real',
    title: 'Heaven is for Real',
    author: 'Todd Burpo with Lynn Vincent',
    cover: '#EDC531',
    accent: '#26114E',
    summary:
      "This book tells a family's account of their young son's description of heaven following a near-death experience during a serious illness. Told by the boy's father, it is written for readers who find comfort in a hopeful, faith-informed picture of what may lie beyond this life. For someone grieving, the longing to believe that a loved one is safe and at peace can be deep, and this book speaks warmly to that hope. It offers a tender, reassuring vision of the beyond rather than an argument, and many readers have found solace in its gentle confidence. The book suits people who hold or lean toward a Christian frame, and who want a comforting story to sit with when they wonder where someone they loved has gone. It does not ask the reader to prove anything, only to consider a hopeful possibility and take from it what brings peace. In the quiet moments of grief, when questions about the afterlife weigh heavily, a hopeful image of where a person may be can ease some of the ache. For readers drawn to that kind of comfort, this book offers a gentle, heartfelt account and the reassurance that love and connection may continue beyond death. It is best read as consolation, a soft place to rest a tired and grieving heart.",
  },
  {
    id: 'broken-walk',
    title: 'Broken Walk',
    author: 'Gary Roe',
    cover: '#26114E',
    accent: '#EDC531',
    summary:
      "In this book Gary Roe writes again from lived experience of loss, walking beside the reader through the disorientation that grief brings to ordinary life. Roe has long accompanied bereaved people, and his voice here is gentle and unhurried, the voice of someone who knows how unsteady the days can feel after a death. He understands that grief can make familiar life feel strange, that simple tasks can suddenly seem heavy, and that a person can feel as though the ground has shifted beneath them. Rather than offering quick fixes, he encourages slowing down and taking the day one step at a time, and he reminds the reader that leaning on others is not weakness but a natural part of being carried through hard times. The book makes room for the full weight of sorrow while offering steadying company for the stretches when grief feels like too much. It suits anyone whose loss has left them feeling off balance in their own life, and who wants a compassionate companion rather than instruction. Roe's tone is patient and kind throughout, meeting the reader where they are and never pushing them to hurry. For people trying to keep walking through grief when every step feels uncertain, this book offers understanding, encouragement, and the quiet reassurance that they do not have to walk it alone.",
  },
  {
    id: 'grieving-beyond-gender',
    title: 'Grieving Beyond Gender: Understanding Diverse Grieving Styles',
    author: 'Kenneth J. Doka and Terry L. Martin',
    cover: '#0E5F18',
    accent: '#F6F1E7',
    summary:
      "This book challenges the common assumption that there is one right way to grieve, and it offers a more spacious understanding of why people mourn so differently. Kenneth Doka and Terry Martin describe patterns they call intuitive and instrumental grieving, ways of responding to loss that lean more toward feeling or more toward doing, and they show that both are valid and healthy. For someone who has wondered whether they are grieving wrongly because they cry less than others, or more, or express their sorrow through activity rather than tears, this book can be a real relief. It reassures the reader that grief takes many shapes and that their own way of mourning is legitimate. The book also helps people understand loved ones who grieve unlike themselves, easing the friction and hurt that can arise when family members mourn the same loss in very different ways. Though grounded in the authors' work in the grief field, it is written accessibly enough to help ordinary readers make sense of their own experience. It suits anyone who has felt judged or confused by how they or those around them grieve. For readers who need permission to grieve in the way that fits them, and room to let others do the same, this book offers understanding, validation, and a gentler view of what mourning can look like.",
  },
  {
    id: 'grief-counseling-grief-therapy',
    title: 'Grief Counseling and Grief Therapy',
    author: 'J. William Worden',
    cover: '#338233',
    accent: '#26114E',
    summary:
      'This is a foundational clinical text describing the work of mourning, written primarily for professionals but clarifying for anyone who wants to understand what grief asks of a person. J. William Worden frames grief in terms of tasks the mourner gradually moves through, such as coming to accept the reality of a loss, feeling the pain it brings, adjusting to a life without the person, and finding a way to keep an enduring connection while going on living. For a grieving reader willing to engage with a more structured, thoughtful approach, this framework can bring a sense of order to feelings that otherwise seem chaotic. Worden takes grief seriously as real and demanding work, and his account is careful, humane, and grounded in long clinical experience. The book suits students and helping professionals, but also reflective readers who want to understand the shape of their own grief rather than only feel swept along by it. It reassures the reader that adjusting to a loss does not mean leaving their person behind. While more academic in tone than a bedside comfort book, it offers real clarity and can steady someone who finds meaning in understanding what they are going through. For those who want a trustworthy map of the terrain of mourning, this remains a respected and illuminating guide.',
  },
  {
    id: 'continuing-bonds',
    title: 'Continuing Bonds: New Understandings of Grief',
    author: 'Dennis Klass, Phyllis R. Silverman, and Steven L. Nickman',
    cover: '#190933',
    accent: '#EDC531',
    summary:
      'This is the book that helped reframe healthy grief as keeping a bond with the person who died rather than severing it. Drawing together the work of several researchers, it challenged the older idea that mourning is meant to end with letting go, and it offered instead a view in which an ongoing, changed connection with the person who died is a normal and healthy part of grief. For anyone who has been quietly told to move on, or who has feared that still talking to a loved one or keeping them present means something is wrong, this book can be deeply reassuring. It affirms that staying connected, through ritual, memory, or conversation, is not a sign of being stuck but a natural way of carrying love forward. Though it grew out of scholarship in the grief field, its central idea has brought comfort to countless ordinary readers. The book suits people who never want to leave their person behind and who have felt pressured to grieve toward an ending they do not want. It gives language and permission for a kind of grief that honors the lasting place a loved one holds. For those who find the thought of severing the bond unbearable, this book offers a gentler, truer understanding, that love and connection can continue even after death.',
  },
  {
    id: 'disenfranchised-grief',
    title: 'Disenfranchised Grief: Recognizing Hidden Sorrow',
    author: 'Kenneth J. Doka',
    cover: '#EDC531',
    accent: '#26114E',
    summary:
      'This book names and explores disenfranchised grief, the grief that others fail to recognize, that comes from losses not openly acknowledged or mourned. Kenneth Doka gives language to a sorrow many people carry in silence, whether it follows the death of an ex-partner or estranged relative, a pregnancy loss others did not know about, the death of a beloved animal, or any loss the surrounding world does not treat as worthy of mourning. For someone whose grief has been minimized, dismissed, or left out of the usual rituals of comfort, simply having the experience named can be validating and freeing. Doka shows that the pain of an unrecognized loss is no lighter for going unseen, and that the lack of social permission to grieve can make it even harder to bear. Though it draws on his work in the grief field, the book speaks clearly to anyone trying to make sense of a loss that others have not honored. It suits people who have felt they must hide or explain their grief, and who need reassurance that their sorrow is real and deserved. It encourages naming the loss as legitimate and finding at least one setting where grief is allowed to take up space. For readers whose mourning has gone unacknowledged, this book offers recognition and quiet, steady validation.',
  },
  {
    id: 'twelve-steps-forgiveness',
    title: 'The Twelve Steps of Forgiveness',
    author: 'Paul Ferrini',
    cover: '#26114E',
    accent: '#EDC531',
    summary:
      'This is a contemplative guide to releasing resentment, both toward others and toward oneself, offered as part of the slow work of healing. Paul Ferrini writes in a gentle, spiritual tone, treating forgiveness not as a single decision made once but as a practice returned to over time. For a grieving person, forgiveness can be tangled up with loss in complicated ways, whether it is old hurt within a relationship that ended in death, unfinished conflict, or the harder task of forgiving oneself for things said, unsaid, or left undone. Ferrini approaches these knots with compassion, encouraging the reader to consider setting down one small resentment at a time rather than demanding that they release everything at once. The book suits people drawn to a reflective, spiritual frame who want to loosen the grip of anger, guilt, or blame that can weigh on grief. It does not rush or scold, and it treats self-forgiveness with the same tenderness as forgiving others. For readers carrying regret or bitterness alongside their sorrow, it offers a patient, meditative path toward lightening that load. Read slowly, it can help a person hold their grief with a little more peace, easing some of the private burdens that make loss heavier. For those ready to begin, it offers gentle, unhurried guidance and no judgment.',
  },
  {
    id: 'induced-after-death-communication',
    title: 'Induced After Death Communication',
    author: 'Allan L. Botkin and Craig Hogan',
    cover: '#26114E',
    accent: '#EDC531',
    summary:
      'This book introduces a therapeutic approach, developed with grieving veterans and later shared more widely, that many people describe as a felt sense of reconnection with a loved one who has died. Allan Botkin and Craig Hogan present the accounts of those who have experienced it, along with the reasoning behind the method, for readers who are exploring continued-bond experiences in their grief. For someone mourning, the longing to feel close to a person who is gone can be powerful, and this book speaks to that longing with seriousness rather than dismissal. It describes an approach that arose in clinical work and that some grieving people have found brings comfort and a sense of ongoing connection. The book suits readers who are open to spiritual or experiential ideas about grief and who are curious about accounts of reconnection, and it presents these experiences thoughtfully rather than sensationally. It does not ask anyone to believe more than they wish, and readers are free to take what brings them peace and leave the rest. For those grieving who wonder whether the bond with a loved one can still be felt, this book offers one perspective drawn from many personal accounts, and a gentle sense that the connection some people long for may not be entirely out of reach.',
  },
];

function withModule(module: BookModule) {
  return (b: Omit<Book, 'module'>): Book => ({ ...b, module });
}

export const BOOKS: Book[] = [
  ...PET_BOOKS.map(withModule('pet')),
  ...HUMAN_BOOKS.map(withModule('human')),
];

/**
 * Concrete strategies, practices, and small activities drawn from each book's
 * approach. Shown on the book page, and passed to the companion so its replies
 * can gently draw on the authors a person has added to their library.
 * Voice rules apply: no em dashes, no "closure" or "journey", plain and warm.
 */
export const BOOK_GUIDANCE: Record<string, string[]> = {
  'loss-of-a-pet': [
    'Expect grief to come in waves rather than tidy stages, and let each wave pass without fighting it.',
    'Make a small tribute, a photo board or a written remembrance, to give the loss a place to live.',
    'Reach out to a pet-loss support line or group. Sife built his work on the idea that this grief deserves real support.',
  ],
  'goodbye-friend': [
    'Hold a small ceremony, even alone. A few words, a candle at a distance, a favorite spot outdoors.',
    'Write a goodbye letter to your animal and keep it, or read it aloud.',
    'Choose one keepsake, a collar or a tuft of fur, and give it a settled home rather than hiding it away.',
  ],
  'pet-loss-companion': [
    'Keep one plain sentence ready for people who shrink the loss, so you are not caught off guard.',
    'Tend the hardest ordinary moments on purpose: the empty leash, the food bowl, the spot by the door.',
    'Let everyone in the household grieve in their own way, including other animals who are also missing them.',
  ],
  'grieving-death-of-pet': [
    'Put words to what you feel, out loud or on paper, even when the feelings seem too big or too small.',
    'Find one person who can simply witness your grief without trying to fix it.',
    'When guilt arrives, name it, then set it down gently. It is part of loving, not proof of failing.',
  ],
  'saying-goodbye': [
    'If you chose euthanasia, name the care that was in that choice. Ending suffering is an act of love.',
    'Make a small comfort plan for the hardest hours, a walk, a call, a warm drink, written down before you need it.',
    'For a sudden wave of grief, try slow breathing or naming five things you can see, to steady yourself.',
  ],
  'grief-recovery-handbook': [
    'List the things left unsaid, the thank-yous, the apologies, the I-love-yous.',
    'Turn that list into a completion letter to your animal, and read it when you are ready.',
    'Take one small action today rather than waiting to feel better first.',
  ],
  'book-of-pet-love-loss': [
    'On a hard evening, open the book at random and read a single passage.',
    'Collect the lines that fit your animal, and keep them somewhere you will see them.',
    "Read one aloud, to yourself or to them. Some things are easier borrowed from another's words.",
  ],
  'griffins-heart': [
    'Stop apologizing for how much this hurts. The grief is the size of the love.',
    'Find company, online or in person, where pet grief needs no defending.',
    'Mark the loss where you can see it, so the world knows they mattered.',
  ],
  'repairing-heartbreak': [
    'Pick one small exercise and do it daily rather than a large one now and then.',
    'Notice gentle changes over weeks, not days, and do not measure yourself against anyone else.',
    'Keep a five-minute grounding practice for the moments the grief spikes.',
  ],
  'honoring-our-animals': [
    'Set up a small memory space, a photo, their collar, a candle kept at a safe distance.',
    'On hard dates, do one honoring practice: a walk you shared, their favorite treat left out, a few quiet minutes.',
    'Let the bond continue. Honoring the relationship is not holding on too long, it is carrying it well.',
  ],
  'letters-to-grief': [
    'Write a short letter addressed to your grief, saying exactly what you feel without softening it.',
    'Let the letter be honest rather than tidy. You are not trying to reach an ending.',
  ],
  'navigating-intense-grief': [
    'When a wave feels unbearable, name it as a wave and let it move through, rather than bracing against it.',
    'On the hardest days, lower the bar to one small, doable thing.',
  ],
  'shattered-surviving-loss-child': [
    "Grieve at your own pace, without measuring it against anyone else's.",
    'Keep one small ritual that keeps your child present in daily life.',
  ],
  'grief-recovery-handbook-workbook': [
    'Make a timeline of the relationship, noting what you wish had been different and what you are grateful for.',
    'Work one exercise at a time, and stop when you need to rest.',
  ],
  'fk-death-workbook': [
    'Give yourself permission to be angry on the page, in whatever language is honest.',
    'Use humor when it helps, without forcing yourself to feel lighter than you do.',
  ],
  'imagine-heaven': [
    'If it comforts you, spend a few quiet minutes picturing your person at peace.',
    'Hold questions about the afterlife gently, without needing certain answers.',
  ],
  'the-broken-way': [
    'Notice one small grace in an ordinary day, and let it sit alongside the pain rather than erase it.',
    'Let brokenness be something you carry, not something you must fix today.',
  ],
  'survive-death-adult-child': [
    "Tell stories from your child's whole life, not only the ending.",
    'Find one person who lets you speak their name without changing the subject.',
  ],
  'journey-of-souls': [
    'If the idea brings you peace, picture your person as whole and unburdened now.',
    'Take what comforts you, and leave the rest.',
  ],
  'signs-secret-language': [
    'Keep a short note of any small signs you notice, without needing to prove them.',
    'Let a sign be a moment of connection rather than something to explain.',
  ],
  'bearing-the-unbearable': [
    'Let love and grief sit together, since they come from the same place.',
    'Be as kind to yourself as you would be to a grieving friend.',
  ],
  'i-wasnt-ready-to-say-goodbye': [
    'In the earliest days, focus only on the next necessary thing.',
    'Expect grief to be uneven, and let hard days come without reading them as failure.',
  ],
  'healing-after-loss': [
    'Read one short passage in the morning, and carry a single line into the day.',
    'Let each day stand on its own.',
  ],
  'when-grown-kids-disappoint': [
    'Name what you are grieving, even when the person is still living.',
    'Separate what you can influence from what you cannot, and grieve the difference.',
  ],
  'heaven-is-for-real': [
    'If it helps, hold a hopeful image of where your person may be.',
    'Let comfort come without requiring proof.',
  ],
  'broken-walk': [
    'When the day feels unsteady, slow down and take it one step at a time.',
    'Let yourself lean on others without apologizing for the weight.',
  ],
  'grieving-beyond-gender': [
    'Grieve in the way that fits you, whether through feeling, doing, or both.',
    'Give the people around you room to grieve differently than you do.',
  ],
  'grief-counseling-grief-therapy': [
    'Let grief include real tasks: accepting the loss, feeling the pain, and adjusting to life without them.',
    'Remember that adjusting does not mean leaving your person behind.',
  ],
  'continuing-bonds': [
    'Keep a place for your person in your life, through ritual, memory, or conversation.',
    'Staying connected is a healthy part of grief, not a sign you are stuck.',
  ],
  'disenfranchised-grief': [
    'Name your loss as real, even if others do not treat it that way.',
    'Find one setting where your grief is allowed to take up space.',
  ],
  'twelve-steps-forgiveness': [
    'Consider one small resentment you are ready to set down, including toward yourself.',
    'Let forgiveness be a slow practice, not a single decision.',
  ],
};

export function guidanceFor(id: string): string[] {
  return BOOK_GUIDANCE[id] ?? [];
}

export type LibraryGuidance = {
  title: string;
  author: string;
  guidance: string[];
  summary: string;
};

/** The books a user has added, with their practices, for the companion to draw on. */
export function libraryGuidance(bookIds: string[]): LibraryGuidance[] {
  return bookIds
    .map((id) => BOOKS.find((b) => b.id === id))
    .filter((b): b is Book => Boolean(b))
    .map((b) => ({
      title: b.title,
      author: b.author,
      guidance: guidanceFor(b.id),
      summary: b.summary,
    }));
}

/** Every book that belongs to a given loss path. */
export function booksForModule(module: BookModule): Book[] {
  return BOOKS.filter((b) => b.module === module);
}

/**
 * What the companion should actually draw on: only the books the user has added
 * to their own library. If they have added none, the companion references no
 * books at all. It must never mention or suggest a book before the user has
 * built their library, so early journaling never surfaces a title the user has
 * not chosen. (The reference library is opt-in, via the book questions and the
 * Discover tab.)
 */
export function effectiveLibrary(bookIds: string[], _module: BookModule): LibraryGuidance[] {
  return libraryGuidance(bookIds);
}

/**
 * Entry types where the person is reaching for help, so the companion should
 * warmly answer AND point to a relevant book by title and author.
 */
export const GUIDED_ENTRY_TYPES = ['Grief Question', 'Forgiveness', 'Struggle', 'Practice'];

/**
 * What the companion draws on for a given entry. For the help-seeking entry
 * types above, it uses the user's chosen books, or the whole loss-path library
 * if they have not built one yet, so a fitting book can always be named. For
 * every other entry type it uses only the books the user has added (which is
 * empty until they build their library).
 */
export function libraryForEntry(
  bookIds: string[],
  module: BookModule,
  entryType: string,
): LibraryGuidance[] {
  if (GUIDED_ENTRY_TYPES.includes(entryType)) {
    const ids = bookIds.length ? bookIds : booksForModule(module).map((b) => b.id);
    return libraryGuidance(ids);
  }
  return effectiveLibrary(bookIds, module);
}
