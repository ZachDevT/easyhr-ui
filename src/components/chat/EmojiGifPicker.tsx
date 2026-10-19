"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Smile, Search, X, Loader2, Plus } from 'lucide-react';
import { GifIcon, AnimatedEmojiIcon } from './ChatCustomIcons';

export type PickerTab = 'emoji' | 'animated' | 'gif';

interface EmojiGifPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSelectAnimatedEmoji?: (code: string, url: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onClose: () => void;
  initialTab?: PickerTab;
}

type EmojiCategory =
  | 'All'
  | 'Smileys'
  | 'Gestures'
  | 'People'
  | 'Work & Tech'
  | 'Celebration'
  | 'Symbols'
  | 'Nature'
  | 'Food'
  | 'Travel & Sport';

const EMOJI_CATEGORIES: EmojiCategory[] = [
  'All',
  'Smileys',
  'Gestures',
  'People',
  'Work & Tech',
  'Celebration',
  'Symbols',
  'Nature',
  'Food',
  'Travel & Sport',
];

// Compact high-stock emoji catalog (~520 emojis across all categories)
const EMOJI_GROUPS: Record<Exclude<EmojiCategory, 'All'>, { chars: string[]; keywords: string }> = {
  Smileys: {
    keywords: 'smile happy laugh joy grin wink love heart cool star party mind blown cry sad angry sleep',
    chars: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️',
      '😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🫣','🤫','🤔','🫡','🤐','🤨','😐','😑',
      '😶','🫥','😶‍🌫️','😏','😒','🙄','😬','😮‍💨','🤥','🫨','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
      '🤧','🥵','🥶','🥴','😵','😵‍💫','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','🫤','😟','🙁','☹️','😮','😯',
      '😲','😳','🥺','🥹','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤',
      '😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼',
      '😽','🙀','😿','😾',
    ],
  },
  Gestures: {
    keywords: 'hand thumb clap wave ok peace fingers fist pray muscle point eyes',
    chars: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','🫷','🫸','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙',
      '👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏',
      '✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄',
      '🫦',
    ],
  },
  People: {
    keywords: 'person baby man woman doctor student teacher technologist artist astronaut',
    chars: [
      '👶','👧','🧒','👦','👩','🧑','👨','👩‍🦱','🧑‍🦱','👨‍🦱','👩‍🦰','🧑‍🦰','👨‍🦰','👱‍♀️','👱','👱‍♂️','👩‍🦳','🧑‍🦳','👨‍🦳','👩‍🦲',
      '🧑‍🦲','👨‍🦲','🧔‍♀️','🧔','🧔‍♂️','👵','🧓','👴','👲','👳‍♀️','👳','👳‍♂️','🧕','👮‍♀️','👮','👮‍♂️','👷‍♀️','👷','👷‍♂️','💂‍♀️',
      '💂','💂‍♂️','🕵️‍♀️','🕵️','🕵️‍♂️','👩‍⚕️','🧑‍⚕️','👨‍⚕️','👩‍🌾','🧑‍🌾','👨‍🌾','👩‍🍳','🧑‍🍳','👨‍🍳','👩‍🎓','🧑‍🎓','👨‍🎓','👩‍🎤','🧑‍🎤','👨‍🎤',
      '👩‍🏫','🧑‍🏫','👨‍🏫','👩‍🏭','🧑‍🏭','👨‍🏭','👩‍💻','🧑‍💻','👨‍💻','👩‍💼','🧑‍💼','👨‍💼','👩‍🔧','🧑‍🔧','👨‍🔧','👩‍🔬','🧑‍🔬','👨‍🔬','👩‍🎨','🧑‍🎨',
      '👨‍🎨','👩‍🚒','🧑‍🚒','👨‍🚒','👩‍✈️','🧑‍✈️','👨‍✈️','👩‍🚀','🧑‍🚀','👨‍🚀','👩‍⚖️','🧑‍⚖️','👨‍⚖️','🦸‍♀️','🦸','🦸‍♂️','🦹‍♀️','🦹','🦹‍♂️','🥷',
    ],
  },
  'Work & Tech': {
    keywords: 'laptop computer phone office chart folder file document calendar clock idea tool lock key mail',
    chars: [
      '💼','📁','📂','🗂️','📅','📆','🗒️','🗓️','📇','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️',
      '🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','🔫','🪃','🏹','🛡️',
      '🪚','🔧','🪛','🔩','⚙️','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','⚗️','🧪','🧫','🧬','🔬','🔭',
      '📡','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','📺','📷','📸','📹','📼',
      '🔍','🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰',
      '🗞️','📑','🔖','🏷️','💰','🪙','💴','💵','💶','💷','💸','💳','🧾','💹','✉️','📧','📨','📩','📤','📥',
      '📦','📫','📪','📬','📭','📮','🗳️','✏️','✒️','🖋️','🖊️','🖌️','🖍️','📝','📞','☎️','📟','📠','🔋','🪫',
      '🔌','🔔','🔕','📣','📢','💬','💭','🗯️','⏱️','⏲️','⏰','🕰️','⌛','⏳',
    ],
  },
  Celebration: {
    keywords: 'party tada confetti balloon cake gift trophy medal star crown fire rocket',
    chars: [
      '🎉','🎊','🎈','🎂','🎀','🎁','🎗️','🎟️','🎫','🎖️','🏆','🏅','🥇','🥈','🥉','✨','🌟','⭐','💫','💥',
      '🔥','🚀','⚡','🌈','👑','💎','🥂','🍾','🥳','🪩','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺',
      '🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩','🪄','🪅','🪆','🧨','🎆','🎇','🎐','🎏','🎎',
    ],
  },
  Symbols: {
    keywords: 'heart check cross warning question exclamation arrow circle square hundred',
    chars: [
      '❤️','🩷','🧡','💛','💚','💙','🩵','💜','🖤','🩶','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘',
      '💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍',
      '♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚',
      '💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫',
      '💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️',
      '🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️',
      '🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡',
      '🔠','🆖','🆗','🆙','🆒','🆕','🆓','⬆️','↗️','➡️','↘️','⬇️','↙️','⬅️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️',
      '🔃','🔄','🔙','🔚','🔛','🔜','🔝','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔺','🔻','🔸','🔹',
      '🔶','🔷','🔳','🔲','▪️','▫️','◾','◽','◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','🔈',
      '🔇','🔉','🔊','♾️','☑️','✔️','✖️','➕','➖','➗','➰','➿','〽️','©️','®️','™️',
    ],
  },
  Nature: {
    keywords: 'dog cat lion tiger horse unicorn bird fish tree flower sun moon star earth fire water',
    chars: [
      '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊',
      '🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌',
      '🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀',
      '🪼','🪸','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪',
      '🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛',
      '🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔',
      '🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🪺',
      '🪹','🍄','🐚','🌾','💐','🌷','🌹','🥀','🪷','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖',
      '🌗','🌘','🌑','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐','🌟','✨','⚡','☄️','💥','🔥','🌪️',
      '🌈','☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','💧','💦','🫧','☔',
      '☂️','🌊','🌫️',
    ],
  },
  Food: {
    keywords: 'coffee tea pizza burger fries sushi cake fruit apple banana drink beer wine',
    chars: [
      '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑',
      '🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳',
      '🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗',
      '🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡',
      '🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🫘','🍯','🥛','🍼',
      '🫖','☕','🍵','🧃','🥤','🧋','🫙','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴',
      '🍽️','🥣','🥡','🥢','🧂',
    ],
  },
  'Travel & Sport': {
    keywords: 'car plane train rocket bike house building soccer basketball tennis gym medal',
    chars: [
      '⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳',
      '🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️‍♀️','🏋️','🏋️‍♂️','🤼‍♀️',
      '🤼','🤼‍♂️','🤸‍♀️','🤸','🤸‍♂️','⛹️‍♀️','⛹️','⛹️‍♂️','🤺','🤾‍♀️','🤾','🤾‍♂️','🏌️‍♀️','🏌️','🏌️‍♂️','🏇','🧘‍♀️','🧘','🧘‍♂️','🏄‍♀️',
      '🏄','🏄‍♂️','🏊‍♀️','🏊','🏊‍♂️','🤽‍♀️','🤽','🤽‍♂️','🚣‍♀️','🚣','🚣‍♂️','🧗‍♀️','🧗','🧗‍♂️','🚵‍♀️','🚵','🚵‍♂️','🚴‍♀️','🚴','🚴‍♂️',
      '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵',
      '🏍️','🛺','🚨','🚔','🚍','🚘','🚖','🛞','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆',
      '🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶','⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓',
      '🛟','⛽','🚧','🚦','🚥','🚏','🗺️','🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️',
      '🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🛖','🏠','🏡','🏘️','🏚️','🏗️','🏭','🏢','🏬','🏣','🏤','🏥','🏦',
      '🏨','🏪','🏫','🏩','💒','🏛️','⛪','🕌','🕍','🛕','🕋','⛩️',
    ],
  },
};

// Large catalog of 84 Google Noto Animated Emojis (codepoints on fonts.gstatic.com)
export const ANIMATED_EMOJI_CODES: { code: string; keywords: string }[] = [
  { code: '1f680', keywords: 'rocket launch ship deploy' },
  { code: '1f525', keywords: 'fire hot lit flame' },
  { code: '1f389', keywords: 'party popper tada celebrate' },
  { code: '1f44f', keywords: 'clap applause bravo' },
  { code: '2764_fe0f', keywords: 'heart red love' },
  { code: '1f4af', keywords: '100 hundred perfect' },
  { code: '2728', keywords: 'sparkles shine magic' },
  { code: '1f92f', keywords: 'mind blown exploding' },
  { code: '1f973', keywords: 'partying celebrate birthday' },
  { code: '1f929', keywords: 'star struck excited' },
  { code: '1f602', keywords: 'joy laughing tears' },
  { code: '1f923', keywords: 'rofl rolling laughing' },
  { code: '1f44d', keywords: 'thumbs up like approve' },
  { code: '1f64c', keywords: 'raising hands hooray' },
  { code: '1f440', keywords: 'eyes looking watching' },
  { code: '1f3c6', keywords: 'trophy winner champion' },
  { code: '26a1', keywords: 'zap lightning high voltage' },
  { code: '1f60d', keywords: 'heart eyes love' },
  { code: '1f970', keywords: 'smiling hearts love warm' },
  { code: '1f60e', keywords: 'sunglasses cool' },
  { code: '1f914', keywords: 'thinking hmm question' },
  { code: '1f64f', keywords: 'pray thank you please' },
  { code: '1f4aa', keywords: 'muscle strong biceps flex' },
  { code: '1f3af', keywords: 'target bullseye goal' },
  { code: '1f4a1', keywords: 'light bulb idea' },
  { code: '1fae1', keywords: 'salute respect' },
  { code: '1f91d', keywords: 'handshake deal team' },
  { code: '1f44b', keywords: 'wave hello hi' },
  { code: '2705', keywords: 'check mark done verified' },
  { code: '1f38a', keywords: 'confetti ball party' },
  { code: '1f451', keywords: 'crown king queen' },
  { code: '1f48e', keywords: 'gem diamond crystal' },
  { code: '1f31f', keywords: 'glowing star shine' },
  { code: '1f4a5', keywords: 'boom collision explosion' },
  { code: '1f600', keywords: 'grinning happy smile' },
  { code: '1f604', keywords: 'smile happy joy' },
  { code: '1f601', keywords: 'beaming grin' },
  { code: '1f606', keywords: 'laughing squinting' },
  { code: '1f605', keywords: 'sweat smile relief' },
  { code: '1f609', keywords: 'wink' },
  { code: '1f60a', keywords: 'blush smile' },
  { code: '1f607', keywords: 'innocent angel halo' },
  { code: '1f618', keywords: 'kissing heart' },
  { code: '1f60b', keywords: 'yum delicious' },
  { code: '1f61c', keywords: 'wink tongue playful' },
  { code: '1f92a', keywords: 'zany crazy wild' },
  { code: '1f911', keywords: 'money mouth rich' },
  { code: '1f917', keywords: 'hugging warm' },
  { code: '1f92d', keywords: 'giggle hand over mouth' },
  { code: '1f92b', keywords: 'shushing quiet' },
  { code: '1f913', keywords: 'nerd glasses smart' },
  { code: '1f9d0', keywords: 'monocle inspect' },
  { code: '1f631', keywords: 'scream shocked omg' },
  { code: '1f62d', keywords: 'sob crying loud' },
  { code: '1f624', keywords: 'triumph steam proud' },
  { code: '1f621', keywords: 'angry rage mad' },
  { code: '1f97a', keywords: 'pleading puppy eyes' },
  { code: '1f972', keywords: 'smiling tear grateful' },
  { code: '1fae0', keywords: 'melting face' },
  { code: '1fae3', keywords: 'peeking eye' },
  { code: '1fae2', keywords: 'open eyes hand over mouth' },
  { code: '1f634', keywords: 'sleeping tired zzz' },
  { code: '1f975', keywords: 'hot sweating' },
  { code: '1f976', keywords: 'cold freezing' },
  { code: '1f920', keywords: 'cowboy hat' },
  { code: '1f978', keywords: 'disguised glasses' },
  { code: '1f47b', keywords: 'ghost boo' },
  { code: '1f916', keywords: 'robot ai bot' },
  { code: '1f47d', keywords: 'alien ufo' },
  { code: '1f44c', keywords: 'ok hand perfect' },
  { code: '270c_fe0f', keywords: 'victory peace' },
  { code: '1f91e', keywords: 'crossed fingers luck' },
  { code: '1faf6', keywords: 'heart hands love' },
  { code: '1f44a', keywords: 'fist bump' },
  { code: '2615', keywords: 'coffee hot beverage morning' },
  { code: '1f37b', keywords: 'cheers beers clinking' },
  { code: '1f942', keywords: 'champagne glasses toast' },
  { code: '1f382', keywords: 'birthday cake' },
  { code: '1f388', keywords: 'balloon red' },
  { code: '1f381', keywords: 'gift present wrapped' },
  { code: '1f947', keywords: 'first place gold medal' },
  { code: '1f4c8', keywords: 'chart increasing growth' },
  { code: '1f4bb', keywords: 'laptop computer code' },
  { code: '1f514', keywords: 'bell notification' },
];

export function getAnimatedEmojiUrl(code: string) {
  return `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.gif`;
}

const FALLBACK_GIFS = [
  { id: 'fb-1', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif', keywords: 'party celebrate tada celebration' },
  { id: 'fb-2', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif', keywords: 'rocket launch ship feature deploy' },
  { id: 'fb-3', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.gif', keywords: 'mind blown explode shocked wow' },
  { id: 'fb-4', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif', keywords: 'fire hot lit amazing' },
  { id: 'fb-5', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4af/512.gif', keywords: 'hundred 100 perfect agree' },
  { id: 'fb-6', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.gif', keywords: 'laughing lol rofl hilarious funny' },
  { id: 'fb-7', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif', keywords: 'thumbs up like good yes approve' },
  { id: 'fb-8', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif', keywords: 'applause clapping cheer bravo' },
  { id: 'fb-9', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif', keywords: 'heart love support thank you' },
  { id: 'fb-10', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif', keywords: 'cool sunglasses smooth confident' },
  { id: 'fb-11', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif', keywords: 'high five pray thank you grateful' },
  { id: 'fb-12', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bb/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4bb/512.gif', keywords: 'coding laptop computer work developer tech' },
  { id: 'fb-13', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2615/512.gif', keywords: 'coffee morning break tea cafe' },
  { id: 'fb-14', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f929/512.gif', keywords: 'star eyes excited amaze wow' },
  { id: 'fb-15', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif', keywords: 'sparkles magic shiny new clean' },
  { id: 'fb-16', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif', keywords: 'trophy winner champion victory' },
  { id: 'fb-17', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/2705/512.gif', keywords: 'check mark done approved success' },
  { id: 'fb-18', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.gif', keywords: 'crown king queen leader vip' },
  { id: 'fb-19', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f913/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f913/512.gif', keywords: 'nerd glasses smart genius' },
  { id: 'fb-20', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif', keywords: 'wave hello hi bye welcome' },
  { id: 'fb-21', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif', keywords: 'flex muscle strength strong team' },
  { id: 'fb-22', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f440/512.gif', keywords: 'eyes looking watching review see' },
  { id: 'fb-23', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.gif', keywords: 'gem diamond precious valuable quality' },
  { id: 'fb-24', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fa84/512.gif', preview: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1fa84/512.gif', keywords: 'magic wand sparkle miracle' },
];

const KLIPY_API_KEY = 'XsffCdMQnhohtJoj69V58f0FpCTKwYSYswA6POid6scjIfyuLThFXzLQQnjonzhY';
const KLIPY_BASE_URL = 'https://api.klipy.com/v2';

export interface GifItem {
  id: string;
  url: string;
  preview: string;
  title?: string;
}

const GIF_QUICK_TAGS = [
  'Trending',
  'Celebrate',
  'Applause',
  'Thumbs Up',
  'Launch',
  'Mind Blown',
  'Thank You',
  'Coding',
  'High Five',
  'Excited',
  'Laughing',
  'Coffee',
];

export function EmojiGifPicker({
  onSelectEmoji,
  onSelectAnimatedEmoji,
  onSelectGif,
  onClose,
  initialTab = 'emoji',
}: EmojiGifPickerProps) {
  const [activeTab, setActiveTab] = useState<PickerTab>(initialTab);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>('All');
  const [animSearch, setAnimSearch] = useState('');

  const [gifSearch, setGifSearch] = useState('');
  const [gifResults, setGifResults] = useState<GifItem[]>([]);
  const [gifNextPos, setGifNextPos] = useState<string>('');
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);

  // Sync tab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Real-time Klipy GIF fetch (Trending or Search)
  const fetchKlipyGifs = useCallback(async (query: string, pos = '', append = false) => {
    try {
      setIsLoadingGifs(true);
      const trimmed = query.trim();
      let url = '';
      if (!trimmed || trimmed.toLowerCase() === 'trending') {
        url = `${KLIPY_BASE_URL}/featured?key=${KLIPY_API_KEY}&limit=24`;
      } else {
        url = `${KLIPY_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&key=${KLIPY_API_KEY}&limit=24`;
      }
      if (pos) {
        url += `&pos=${encodeURIComponent(pos)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const results: GifItem[] = (data.results || []).map((item: any) => {
          const fm = item.media_formats || {};
          const gifUrl = fm.gif?.url || fm.mediumgif?.url || item.url || '';
          const previewUrl =
            fm.tinygif?.url ||
            fm.nanogif?.url ||
            fm.tinygifpreview?.url ||
            fm.gifpreview?.url ||
            gifUrl;
          return {
            id: String(item.id),
            url: gifUrl,
            preview: previewUrl,
            title: item.title || '',
          };
        }).filter((g: GifItem) => Boolean(g.url));

        if (append) {
          setGifResults((prev) => [...prev, ...results]);
        } else {
          setGifResults(results);
        }
        setGifNextPos(data.next || '');
      }
    } catch {
      // Keep existing results
    } finally {
      setIsLoadingGifs(false);
    }
  }, []);

  // Fetch initial trending GIFs on mount or tab activation
  useEffect(() => {
    if (activeTab === 'gif' && gifResults.length === 0 && !gifSearch) {
      fetchKlipyGifs('');
    }
  }, [activeTab, fetchKlipyGifs, gifResults.length, gifSearch]);

  // Debounced real-time search
  useEffect(() => {
    if (activeTab !== 'gif') return;
    const timer = setTimeout(() => {
      fetchKlipyGifs(gifSearch);
    }, 280);
    return () => clearTimeout(timer);
  }, [activeTab, gifSearch, fetchKlipyGifs]);

  // Filtered Emojis
  const displayedEmojis = React.useMemo(() => {
    const q = emojiSearch.trim().toLowerCase();
    const categoriesToScan =
      emojiCategory === 'All'
        ? (Object.keys(EMOJI_GROUPS) as Exclude<EmojiCategory, 'All'>[])
        : [emojiCategory];

    const list: string[] = [];
    categoriesToScan.forEach((cat) => {
      const group = EMOJI_GROUPS[cat];
      if (!q || group.keywords.includes(q) || cat.toLowerCase().includes(q)) {
        list.push(...group.chars);
      } else {
        group.chars.forEach((ch) => {
          if (ch.includes(q)) list.push(ch);
        });
      }
    });
    return list;
  }, [emojiCategory, emojiSearch]);

  // Filtered Animated Emojis
  const displayedAnimated = React.useMemo(() => {
    const q = animSearch.trim().toLowerCase();
    if (!q) return ANIMATED_EMOJI_CODES;
    return ANIMATED_EMOJI_CODES.filter((a) => a.keywords.includes(q));
  }, [animSearch]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 10px)',
        right: 16,
        zIndex: 90,
        width: 392,
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid var(--card-border, #E4E4E7)',
        boxShadow: '0 20px 48px -12px rgba(17, 17, 24, 0.2), 0 4px 14px -2px rgba(17, 17, 24, 0.08)',
        overflow: 'hidden',
        color: 'var(--text-1, #18181B)',
      }}
    >
      {/* Top Tabs Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px 0 10px',
          background: '#FAF9F7',
          borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={() => setActiveTab('emoji')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 11px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: '10px 10px 0 0',
              border: activeTab === 'emoji' ? '1px solid var(--card-border, #E4E4E7)' : '1px solid transparent',
              borderBottom: activeTab === 'emoji' ? '1px solid #FFFFFF' : 'none',
              marginBottom: -1,
              background: activeTab === 'emoji' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'emoji' ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
              cursor: 'pointer',
            }}
          >
            <Smile size={13.5} />
            <span>Emojis ({displayedEmojis.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('animated')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 11px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: '10px 10px 0 0',
              border: activeTab === 'animated' ? '1px solid var(--card-border, #E4E4E7)' : '1px solid transparent',
              borderBottom: activeTab === 'animated' ? '1px solid #FFFFFF' : 'none',
              marginBottom: -1,
              background: activeTab === 'animated' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'animated' ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
              cursor: 'pointer',
            }}
          >
            <AnimatedEmojiIcon size={14} />
            <span>Animated ({ANIMATED_EMOJI_CODES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gif')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 11px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: '10px 10px 0 0',
              border: activeTab === 'gif' ? '1px solid var(--card-border, #E4E4E7)' : '1px solid transparent',
              borderBottom: activeTab === 'gif' ? '1px solid #FFFFFF' : 'none',
              marginBottom: -1,
              background: activeTab === 'gif' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'gif' ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
              cursor: 'pointer',
            }}
          >
            <GifIcon size={14} />
            <span>GIFs</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-3, #A1A1AA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 4,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* TAB 1: 500+ CATEGORIZED EMOJIS */}
      {activeTab === 'emoji' && (
        <div style={{ padding: 12 }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3, #A1A1AA)',
              }}
            />
            <input
              type="text"
              placeholder="Search 500+ emojis..."
              value={emojiSearch}
              onChange={(e) => setEmojiSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                fontSize: 12,
                background: '#FAF9F7',
                border: '1px solid var(--card-border, #E4E4E7)',
                borderRadius: 8,
                outline: 'none',
                color: 'var(--text-1, #18181B)',
              }}
            />
          </div>

          {/* Category Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              overflowX: 'auto',
              paddingBottom: 8,
              marginBottom: 6,
              borderBottom: '1px solid var(--border-subtle, #F0F0F3)',
              scrollbarWidth: 'none',
            }}
          >
            {EMOJI_CATEGORIES.map((cat) => {
              const active = emojiCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEmojiCategory(cat)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    border: active ? '1px solid var(--primary, #A238FF)' : '1px solid transparent',
                    background: active ? 'var(--primary-tint, #F5EBFF)' : '#F4F4F5',
                    color: active ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(9, 1fr)',
              gap: 3,
              maxHeight: 255,
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
            {displayedEmojis.map((char, idx) => (
              <button
                key={`${char}-${idx}`}
                type="button"
                onClick={() => {
                  onSelectEmoji(char);
                }}
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 19,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease, transform 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F4F4F5';
                  e.currentTarget.style.transform = 'scale(1.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: 84 ANIMATED EMOJIS (Inserted Inline After Text — No Labels!) */}
      {activeTab === 'animated' && (
        <div style={{ padding: 12 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3, #A1A1AA)',
              }}
            />
            <input
              type="text"
              placeholder="Search animated emojis (fire, rocket, clap, heart...)"
              value={animSearch}
              onChange={(e) => setAnimSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                fontSize: 12,
                background: '#FAF9F7',
                border: '1px solid var(--card-border, #E4E4E7)',
                borderRadius: 8,
                outline: 'none',
                color: 'var(--text-1, #18181B)',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 6,
              maxHeight: 265,
              overflowY: 'auto',
              padding: 2,
            }}
          >
            {displayedAnimated.map((anim) => {
              const url = getAnimatedEmojiUrl(anim.code);
              return (
                <button
                  key={anim.code}
                  type="button"
                  onClick={() => {
                    if (onSelectAnimatedEmoji) {
                      onSelectAnimatedEmoji(anim.code, url);
                    } else {
                      onSelectEmoji(`[:anim:${anim.code}:]`);
                    }
                  }}
                  style={{
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 10,
                    border: '1px solid transparent',
                    background: '#FAF9F7',
                    cursor: 'pointer',
                    padding: 4,
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary, #A238FF)';
                    e.currentTarget.style.background = 'var(--primary-tint, #F5EBFF)';
                    e.currentTarget.style.transform = 'scale(1.14)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.background = '#FAF9F7';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{ width: 32, height: 32, objectFit: 'contain', display: 'block' }}
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE TENOR GIF SEARCH (Large Stock + Load More + Clean Visual Grid) */}
      {activeTab === 'gif' && (
        <div style={{ padding: 12 }}>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-3, #A1A1AA)',
              }}
            />
            <input
              type="text"
              placeholder="Search any GIF..."
              value={gifSearch}
              onChange={(e) => setGifSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '7px 28px 7px 30px',
                fontSize: 12,
                background: '#FAF9F7',
                border: '1px solid var(--card-border, #E4E4E7)',
                borderRadius: 8,
                outline: 'none',
                color: 'var(--text-1, #18181B)',
              }}
            />
            {isLoadingGifs && (
              <Loader2
                size={13}
                className="animate-spin"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--primary, #A238FF)',
                }}
              />
            )}
          </div>

          {/* Quick Tag Chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              overflowX: 'auto',
              paddingBottom: 8,
              marginBottom: 6,
              scrollbarWidth: 'none',
            }}
          >
            {GIF_QUICK_TAGS.map((tag) => {
              const isSelected =
                (tag === 'Trending' && !gifSearch.trim()) ||
                gifSearch.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setGifSearch(tag === 'Trending' ? '' : tag)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: isSelected ? 700 : 500,
                    border: isSelected ? '1px solid var(--primary, #A238FF)' : '1px solid transparent',
                    background: isSelected ? 'var(--primary-tint, #F5EBFF)' : '#F4F4F5',
                    color: isSelected ? 'var(--primary, #A238FF)' : 'var(--text-2, #52525B)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Clean Visual GIF Grid — No Title Overlays */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 6,
              maxHeight: 255,
              overflowY: 'auto',
            }}
          >
            {gifResults.map((gif, idx) => (
              <button
                key={`${gif.id}-${idx}`}
                type="button"
                onClick={() => {
                  onSelectGif(gif.url);
                  onClose();
                }}
                style={{
                  position: 'relative',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--card-border, #E4E4E7)',
                  background: '#F4F4F5',
                  padding: 0,
                  height: 98,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={gif.preview}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  loading="lazy"
                />
              </button>
            ))}

            {gifNextPos && (
              <button
                type="button"
                onClick={() => fetchKlipyGifs(gifSearch, gifNextPos, true)}
                disabled={isLoadingGifs}
                style={{
                  gridColumn: '1 / -1',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--card-border, #E4E4E7)',
                  background: '#FAF9F7',
                  color: 'var(--text-1, #18181B)',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                {isLoadingGifs ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                <span>Load More GIFs</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
