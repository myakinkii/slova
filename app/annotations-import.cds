annotate ImportService.Import with @odata.draft.enabled;

annotate ImportService.Import with @(
    Capabilities.DeleteRestrictions: {Deletable: true},
    Capabilities.InsertRestrictions: {
        Insertable        : true,
        RequiredProperties: ['lang_code']
    },
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate ImportService.Import with {
    text @UI.MultiLineText;
}

annotate ImportService.Import with @UI: {
    HeaderInfo      : {
        TypeName      : '{i18n>Import}',
        TypeNamePlural: '{i18n>Imports}',
        Title         : {Value: lang_code},
        Description   : {Value: ID}
    },
    LineItem        : [
        {Value: createdBy},
        {Value: lang_code}
    ],
    Identification  : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'ImportService.parseInput',
            Label : '{i18n>import.parseInput}'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'ImportService.mergeResults',
            Label : '{i18n>import.mergeResults}'
        }
    ],
    Facets          : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: '@UI.FieldGroup#Text',
            Label : '{i18n>input}'
        },
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
    ],
    FieldGroup #Text: {Data: [{Value: text}]},
};

annotate ImportService.Sentences with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: text},
        Description   : {Value: hash}
    },
    LineItem  : [{Value: text}],
    Facets    : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'tokens/@UI.LineItem',
        Label : '{i18n>Tokens}'
    }],
    HeaderFacets        : [{
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

annotate ImportService.Sentences.tokens with @UI: {
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

annotate ImportService.Slova.sentences with @UI: {
    HeaderInfo         : {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: sent.text},
        Description   : {Value: sent.hash}
    },
    LineItem           : [{Value: sent.text}]
};

annotate ImportService.Slova with @UI: {
    LineItem            : [
        {Value: pos},
        {Value: morphem},
        {Value: count}
    ],
    HeaderInfo          : {
        TypeName      : '{i18n>Slovo}',
        TypeNamePlural: '{i18n>Slova}',
        Title         : {Value: morphem},
        Description   : {Value: occurence}
    },
    Facets              : [
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

annotate ImportService.Forms with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Form}',
        TypeNamePlural: '{i18n>Forms}',
        Title         : {Value: form}
    },
    LineItem  : [
        {Value: form},
        {Value: ![Case]},
        {Value: Gender},
        {Value: Number},
        {Value: Animacy},
        {Value: Tense},
        {Value: Aspect},
        {Value: Mood},
        {Value: Voice},
        {Value: Person},
        {Value: VerbForm},
        {Value: PronType},
        {Value: Reflex}
    ]
};
