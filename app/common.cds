using {ru.dev4hana.slova as db} from '../db/schema';

annotate db.Slova with {
    lang @Common.Label: '{i18n>lang}';
    morphem @Common.Label: '{i18n>morphem}';
    pos @Common.Label: '{i18n>pos}';
    etymology @Common.Label: '{i18n>etymology}';
    count @Common.Label: '{i18n>count}';
}

annotate db.Forms with {
    form @Common.Label: '{i18n>form}';
}

annotate db.Etymology with {
    root @Common.Label: '{i18n>root}';
    ascii @Common.Label: '{i18n>ascii}';
    reference @Common.Label: '{i18n>reference}';
}

annotate db.Translations with {
    author @Common.Label: '{i18n>author}';
    lang @Common.Label: '{i18n>lang}';
    value @Common.Label: '{i18n>translation}';
}

annotate db.Users with {
    id @Common.Label: '{i18n>id}';
    name @Common.Label: '{i18n>name}';
    defaultLang @Common.Label: '{i18n>lang}';
}