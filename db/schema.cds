using { managed, cuid, sap } from '@sap/cds/common';
using { ru.dev4hana.slova.conllu as conllu } from './conllu';
namespace ru.dev4hana.slova;

entity Languages {
    key code: String;
    name: String;
}

entity Slova {
    key morphem : String;
    key lang : conllu.Languages;
    key pos : conllu.PartsOfSpeech;
    forms : Composition of many Forms on forms.lemma = $self;
    etymology: Association to Etymology;
    definition: String;
    occurence: String;
    count: Integer;
    translations : Association to many Translations on translations.slovo = $self;
    siblings : Association to many Slova on siblings.etymology = $self.etymology;
}

entity Forms : conllu.Features {
    key form : String;
    key lemma : Association to Slova;
}

entity Etymology {
    key root : String;
    ascii: String;
    reference : String;
    slova : Association to many Slova on slova.etymology = $self;
}

entity Users {
    key id : String;
    defaultLang : Association to Languages;
    name : String;
    cards : Association to many Cards on cards.user = $self;
    translations : Association to many Translations on translations.author = $self
}

entity Cards : managed {
    key user : Association to Users;
    key slovo : Association to Slova;
    key translation : Association to Translations;
    history : Composition of many CardGuesses on history.card = $self
}

entity CardGuesses : cuid {
    card : Association to Cards;
    guess: String; 
    now: DateTime;
}

entity Translations : cuid, managed {
    author : Association to Users;
    slovo : Association to Slova;
    lang : Association to Languages;
    value : String;
    likes : Composition of many { key user : Association to Users }
}