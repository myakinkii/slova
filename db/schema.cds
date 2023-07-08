using {
    managed,
    cuid,
    sap
} from '@sap/cds/common';
using {cc.slova.model.conllu as conllu} from './conllu';

namespace cc.slova.model;

aspect CodeList : {
    key code : String;
    name     : String;
}

entity Languages : CodeList {};
entity PartsOfSpeech : CodeList {};
entity Cases : CodeList {};
entity Numbers : CodeList {};
entity Genders : CodeList {};
entity Persons : CodeList {};
entity Tenses : CodeList {};
entity Aspects : CodeList {};
entity Moods : CodeList {};
entity Degrees : CodeList {};
entity Voices : CodeList {};
entity VerbForms : CodeList {};
entity TextSizes : CodeList {};
entity TextLocations : CodeList {};
entity TextTypes : CodeList {};
entity TextModifiers : CodeList {};

entity Stat {
    key lang   : conllu.Languages;
    key pos    : conllu.PartsOfSpeech;
        lemmas : Integer;
        tokens : Integer;
}

entity Slova {
    key morphem      : String;
    key lang         : conllu.Languages;
    key pos          : conllu.PartsOfSpeech;
        forms        : Composition of many Forms
                           on forms.lemma = $self;
        etymology    : Association to Etymology;
        definition   : String;
        occurence    : String;
        count        : Integer;
        translations : Association to many Translations
                           on translations.slovo = $self;
        siblings     : Association to many Slova
                           on siblings.etymology = $self.etymology;
        sentences    : Composition of many {
                           key sent        : Association to Sentences;
                               translation : String;
                       }
}

entity Forms : conllu.Features {
    key form  : String;
    key lemma : Association to Slova;
}

entity Sentences {
    key hash   : String;
        lang   : Association to Languages;
        index  : Integer;
        text   : String;
        tokens : Composition of many Tokens
                     on tokens.sentence = $self;
}

entity Tokens {
    key sentence : Association to Sentences;
    key index    : Integer;
        form     : String;
        lemma    : String;
        pos      : String;
        feats    : String;
}

entity Etymology {
    key root      : String;
        ascii     : String;
        reference : String;
        slova     : Association to many Slova
                        on slova.etymology = $self;
}

entity Users {
    key id           : String(36); // hyphenated guid must fit
        pwd          : String(32); // md5 hash must fit
        pin          : Integer; // to restore creds
        defaultLang  : Association to Languages;
        name         : String;
        cards        : Association to many Cards
                           on cards.user = $self;
        translations : Association to many Translations
                           on translations.author = $self
}

entity Cards : managed {
    key user        : Association to Users;
    key slovo       : Association to Slova;
    key translation : Association to Translations;
        seen        : Boolean;
        random      : Integer;
        count       : Integer;
        history     : Composition of many CardGuesses
                          on history.card = $self
}

entity CardGuesses : cuid {
    card  : Association to Cards;
    guess : String;
    now   : DateTime;
}

entity Translations : cuid, managed {
    author : Association to Users;
    slovo  : Association to Slova;
    lang   : Association to Languages;
    value  : String;
    likes  : Composition of many {
                 key user : Association to Users
             }
}

entity Import : managed, cuid {
    lang         : Association to Languages;
    name         : String;
    status       : Integer default 0;
    publishDate  : DateTime;
    textType     : Association to TextTypes;
    textSize     : Association to TextSizes;
    textModifier : Association to TextModifiers;
    textLocation : Association to TextLocations;
    input        : String;
    text         : LargeString;
    sent         : String;
    indx         : Integer;
    lemma        : String;
    pos          : Association to PartsOfSpeech;
    feats        : String;
    ![case]      : Association to Cases;
    gender       : Association to Genders;
    number       : Association to Numbers;
    person       : Association to Persons;
    tense        : Association to Tenses;
    aspect       : Association to Aspects;
    mood         : Association to Moods;
    voice        : Association to Voices;
    degree       : Association to Degrees;
    verbForm     : Association to VerbForms;
    words        : Composition of many ImportWords
                       on words.import = $self;
    sentences    : Composition of many ImportSentences
                       on sentences.import = $self;
}

entity ImportWords {
    key import    : Association to Import;
    key morphem   : String;
    key lang      : conllu.Languages;
    key pos       : conllu.PartsOfSpeech;
        occurence : String;
        count     : Integer;
        forms     : Composition of many ImportForms
                        on forms.lemma = $self;
        sentences : Composition of many {
                        key sent : Association to ImportSentences
                    }
}

entity ImportForms : conllu.Features {
    key form  : String;
    key lemma : Association to ImportWords;
}

entity ImportSentences {
    key import      : Association to Import;
    key hash        : String;
        lang        : Association to Languages;
        index       : Integer;
        text        : String;
        translation : String;
        tokens      : Composition of many {
                          key index         : Integer;
                              form          : String;
                              lemma         : String;
                              pos           : String;
                              feats         : String;
                              sentence_hash : String;
                      }
}
