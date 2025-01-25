using {cc.slova.model as db} from '../db/schema';

annotate db.Slova with {
    lang      @Common.Label: '{i18n>lang}';
    morphem   @Common.Label: '{i18n>morphem}';
    pos       @Common.Label: '{i18n>pos}';
    etymology @Common.Label: '{i18n>etymology}';
    count     @Common.Label: '{i18n>count}';
    tier     @Common.Label: '{i18n>tier}';
}

annotate db.Forms with {
    form @Common.Label: '{i18n>form}';
}

annotate db.Etymology with {
    root      @Common.Label: '{i18n>root}';
    ascii     @Common.Label: '{i18n>ascii}';
    reference @Common.Label: '{i18n>reference}';
}

annotate db.Translations with {
    author @Common.Label: '{i18n>author}';
    lang   @Common.Label: '{i18n>lang}';
    value  @Common.Label: '{i18n>translation}';
}

annotate db.Users with {
    id          @Common.Label: '{i18n>id}';
    name        @Common.Label: '{i18n>name}';
    defaultLang @Common.Label: '{i18n>lang}';
}

annotate db.Import with {
    lang     @Common.Label: '{i18n>lang}';
    name     @Common.Label: '{i18n>name}';
    sent     @Common.Label: '{i18n>sent}';
    indx     @Common.Label: '{i18n>indx}';
    lemma    @Common.Label: '{i18n>lemma}';
    pos      @Common.Label: '{i18n>pos}';
    feats    @Common.Label: '{i18n>feats}';
    ![case]  @Common.Label: '{i18n>case}';
    number   @Common.Label: '{i18n>number}';
    gender   @Common.Label: '{i18n>gender}';
    person   @Common.Label: '{i18n>person}';
    tense    @Common.Label: '{i18n>tense}';
    aspect   @Common.Label: '{i18n>aspect}';
    mood     @Common.Label: '{i18n>mood}';
    voice    @Common.Label: '{i18n>voice}';
    degree   @Common.Label: '{i18n>degree}';
    verbForm @Common.Label: '{i18n>verbForm}';
}
