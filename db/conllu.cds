namespace ru.dev4hana.slova.conllu;

type Languages : String enum {
    en = 'English';
    de = 'Deutsch';
    hr = 'Hrvatski';
    ru = 'Russian';
    cu = 'Old Church Slavonic';
}

type PartsOfSpeech : String enum {
    ADJ = 'adjective';
    ADP = 'adposition';
    ADV = 'adverb';
    AUX = 'auxiliary';
    CCONJ = 'coordinating conjunction';
    DET = 'determiner';
    INTJ = 'interjection';
    NOUN = 'noun';
    NUM = 'numeral';
    PART = 'particle';
    PRON = 'pronoun';
    PROPN = 'proper noun';
    PUNCT = 'punctuation';
    SCONJ = 'subordinating conjunction';
    SYM = 'symbol';
    VERB = 'verb';
    X = 'other';
}

// features https://universaldependencies.org/ext-feat-index.html

aspect Features : {
    ![Case] : ![Case];
    Gender : Gender;
    Number : Number;
    Animacy : Animacy;
    Tense : Tense;
    Aspect : Aspect;
    Mood : Mood;
    Voice : Voice;
    Person : Person;
    VerbForm : VerbForm;
    PronType : PronType;
    Reflex : Reflex;
    NumType : NumType;
    NumForm: NumForm;
    Definite : Definite;
    Degree : Degree;
    Poss : Poss;
    Variant : Variant;
    Abbr : Abbr;
    Polarity : Polarity;
    Typo : Typo;
    Foreign : Foreign;
}

type ![Case] : String enum {
    Nom = 'nominative';
    Acc = 'accusative';
    Dat = 'dative';
    Gen = 'genitive';
    Voc = 'vocative';
    Ins = 'instrumental';
    Loc = 'locative';
}

type Gender : String enum {
    Com = 'common';
    Fem	= 'feminine';
    Masc = 'masculine';
    Neut = 'neuter';
}

type Number : String enum {
    Sing = 'singular';
    Plur = 'plural';
    Dual = 'dual';
}

type Animacy : String enum {
    Anim = 'animate';
    Hum = 'human';
    Inan = 'inanimate';
    Nhum = 'non-human';
}

type Tense : String enum {
    Past = 'past';
    Pres = 'present';
    Fut = 'future';
}

type Aspect : String enum {
    Imp = 'imperfect';
    Perf = 'perfect';
}

type Mood : String enum {
    Ind = 'indicative';
    Imp = 'imperative';
    Cnd = 'conditional';
}

type Voice : String enum {
    Act = 'active';
    Pass = 'passive';
}

type Person : String enum {
    _0 = 'zero';
    _1 = 'first';
    _2 = 'second';
    _3 = 'third';
}

type VerbForm : String enum {
    Inf = 'infinitive';
    Fin = 'finite';
    Part = 'participle';
    Conv = 'converb';
    Ger = 'gerund';
    Sup = 'supine';
}

type PronType : String enum {
    Prs = 'possessive';
    Rcp = 'reciprocal';
    Int = 'interrogative';
    Rel = 'relative';
    Neg = 'negative';
    Ind = 'indefinite';
}

type Reflex : String enum {
    Yes = 'yes';
}

type NumType : String enum {
    Card = 'cardinal';
    Ord = 'ordinal';
    Mult = 'multiplicative';
    Sets = 'sets';
}

type NumForm : String enum {
    Digit = 'digit';
    Word = 'word';
}

type Definite : String enum {
    Ind = 'indefinite';
    Def = 'definite';
}

type Degree : String enum {
    Pos = 'positive';
    Cmp = 'comparative';
    Sup = 'superlative';
    Dim = 'diminutive';
}

type Poss : String enum {
    Yes = 'yes';
}

type Variant : String enum {
    Short = 'short';
}

type Abbr : String enum {
    Yes = 'yes';
}

type Polarity : String enum {
    Pos = 'positive';
    Neg = 'negative';
}

type Typo : String enum {
    Yes = 'yes';
}

type Foreign : String enum {
    Yes = 'yes';
}
