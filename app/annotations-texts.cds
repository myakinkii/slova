// annotate TextsService.Decks with @odata.draft.enabled;

annotate TextsService.Decks with @UI: {
    HeaderInfo     : {
        TypeName      : '{i18n>Deck}',
        TypeNamePlural: '{i18n>Decks}',
        Title         : {Value: name}
    },
    SelectionFields: [name],
    LineItem       : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'TextsService.addToParent',
            Label : '{i18n>decks.addToParent}'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'TextsService.EntityContainer/createDeck',
            Label : '{i18n>decks.createDeck}'
        },
        {Value: name},
        {Value: createdAt}
    ],
    Facets         : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'texts/@UI.LineItem',
            Label : '{i18n>Texts}'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'decks/@UI.LineItem',
            Label : '{i18n>Decks}'
        }
    ]
};

annotate TextsService.Decks.texts with @(
    Capabilities.DeleteRestrictions: {Deletable: true},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updatable: false}
);

annotate TextsService.Decks.texts with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Text}',
        TypeNamePlural: '{i18n>Texts}',
        Title         : {Value: text.name},
        Description   : {Value: text.lang_code}
    },
    LineItem  : [{
        Value                : text.name,
        ![@HTML5.CssDefaults]: {width: 'auto'}
    }]
};

annotate TextsService.Decks.decks with @(
    Capabilities.DeleteRestrictions: {Deletable: true},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updatable: false}
);

annotate TextsService.Decks.decks with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Deck}',
        TypeNamePlural: '{i18n>Decks}',
        Title         : {Value: deck.name}
    },
    LineItem  : [{
        Value                : deck.name,
        ![@HTML5.CssDefaults]: {width: 'auto'}
    }]
};

annotate TextsService.Texts with @UI: {
    HeaderInfo         : {
        TypeName      : '{i18n>Text}',
        TypeNamePlural: '{i18n>Texts}',
        Title         : {Value: lang_code},
        Description   : {Value: name}
    },
    SelectionFields    : [
        createdBy,
        name,
        lang_code
    ],
    PresentationVariant: {
        SortOrder     : [{
            Property  : createdAt,
            Descending: true
        }, ],
        Visualizations: ['@UI.LineItem']
    },
    LineItem           : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'TextsService.mergeToText',
            Label : '{i18n>texts.mergeToText}'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'TextsService.addToDeck',
            Label : '{i18n>texts.addToDeck}'
        },
        {Value: authorName, ![@HTML5.CssDefaults]: {width: '10rem'} },
        {Value: complexity},
        {Value: name, ![@HTML5.CssDefaults]: {width: 'auto'} },
        {Value: lang_code, ![@HTML5.CssDefaults]: {width: '5rem'} },
        {Value: createdAt, ![@HTML5.CssDefaults]: {width: '15rem'} }
    ],
    Facets             : [
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
    HeaderInfo                 : {
        TypeName      : '{i18n>Token}',
        TypeNamePlural: '{i18n>Tokens}'
    },
    LineItem                   : [
        {
            $Type                : 'UI.DataFieldForAnnotation',
            Target               : '@UI.FieldGroup#MobileFixConcat',
            Label                : 'Type Information',
            ![@HTML5.CssDefaults]: {width: '25rem'}
        },
        {Value: index},
    ],
    FieldGroup #MobileFixConcat: {Data: [
        {Value: form},
        {Value: lemma},
        {Value: pos}
    ]},
    FieldGroup #Mobile         : {Data: [{Value: {$edmJson: {
        $Apply   : [
            {Path: 'form'},
            ' -> ',
            {Path: 'lemma'},
            ' [',
            {Path: 'pos'},
            ']'
        ],
        $Function: 'odata.concat'
    }}}]},
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
    SelectionFields     : [
        pos,
        tier,
        morphem
    ],
    LineItem            : [
        {
            Value                : pos,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {Value: morphem},
        {
            Value                : tier,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : count,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : skip,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {Value: textName}
    ],
    Identification      : [{
        $Type : 'UI.DataFieldForAction',
        Action: 'TextsService.toggleSkip',
        Label : '{i18n>texts.toggleSkip}'
    }],
    HeaderInfo          : {
        TypeName      : '{i18n>Slovo}',
        TypeNamePlural: '{i18n>Slova}',
        Title         : {Value: morphem},
        // Description   : {Value: lang}
        Description   : {Value: {$edmJson: {
            $Apply   : [
                '[',
                {Path: 'tier'},
                '] ',
                {Path: 'pos'},
                ' / ',
                {Path: 'lang'}
            ],
            $Function: 'odata.concat'
        }}}
    },
    HeaderFacets        : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#External',
    }],
    FieldGroup #External: {Data: [{
        Label: '{i18n>definition}',
        Value: definition,
        Url  : definition,
        $Type: 'UI.DataFieldWithUrl'
    }]},
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

annotate TextsService.Forms with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Form}',
        TypeNamePlural: '{i18n>Forms}',
        Title         : {Value: form}
    },
    LineItem  : [{Value: form}]
};
