annotate TextsService.Texts with @UI: {
    HeaderInfo     : {
        TypeName      : '{i18n>Text}',
        TypeNamePlural: '{i18n>Texts}',
        Title         : {Value: lang_code},
        Description   : {Value: name}
    },
    SelectionFields: [
        createdBy,
        lang_code
    ],
    LineItem       : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'TextsService.EntityContainer/createText',
            Label : '{i18n>createText}',
        },
        {Value: createdBy},
        {Value: name},
        {Value: lang_code}
    ],
    Facets         : [
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'words/@UI.LineItem',
            Label        : '{i18n>Words}',
            ![@UI.Hidden]: HasDraftEntity
        },
        {
            $Type        : 'UI.ReferenceFacet',
            Target       : 'sentences/@UI.LineItem',
            Label        : '{i18n>Sentences}',
            ![@UI.Hidden]: HasDraftEntity
        }
    ]
};

annotate TextsService.Sentences with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: text},
        Description   : {Value: lang_code}
    },
    LineItem               : [{
        Value                : text,
        ![@HTML5.CssDefaults]: {width: 'auto'}
    }],
    Facets                 : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'tokens/@UI.LineItem',
        Label : '{i18n>Tokens}'
    }],
    HeaderFacets           : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Translation',
    }],
    FieldGroup #Translation: {Data: [{
        Label: '{i18n>translation}',
        Value: translation,
        Url  : translation,
        $Type: 'UI.DataFieldWithUrl'
    }]},
};

annotate TextsService.Sentences.tokens with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Token}',
        TypeNamePlural: '{i18n>Tokens}'
    },
    LineItem  : [
        {Value: index},
        {Value: form},
        {Value: lemma},
        {Value: pos}
    ]
};

annotate TextsService.Slova.sentences with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: sent.text},
        Description   : {Value: sent.lang_code}
    },
    LineItem               : [{
        Value                : sent.text,
        ![@HTML5.CssDefaults]: {width: 'auto'}
    }],
    Facets                 : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'sent/tokens/@UI.LineItem',
    // Label : '{i18n>Tokens}'
    }],
    HeaderFacets           : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Translation',
    }],
    FieldGroup #Translation: {Data: [{
        Label: '{i18n>translation}',
        Value: sent.translation,
        Url  : sent.translation,
        $Type: 'UI.DataFieldWithUrl'
    }]},
};

annotate TextsService.Slova with @UI: {
    SelectionFields: [
        pos,
        morphem
    ],
    LineItem       : [
        {Value: pos},
        {Value: morphem},
        {Value: count}
    ],
    HeaderInfo     : {
        TypeName      : '{i18n>Slovo}',
        TypeNamePlural: '{i18n>Slova}',
        Title         : {Value: morphem},
        Description   : {Value: occurence}
    },
    Facets         : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'forms/@UI.LineItem',
            Label : '{i18n>forms}'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'sentences/@UI.LineItem',
            Label : '{i18n>sentences}'
        }
    ]
};

annotate TextsService.Forms with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Form}',
        TypeNamePlural: '{i18n>Forms}',
        Title         : {Value: form}
    },
    LineItem  : [{Value: form}]
};
