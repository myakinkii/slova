annotate WorkBookService.Slova with @UI: {
    SelectionFields     : [
        lang,
        pos,
        tier,
        morphem,
        etymology
    ],
    LineItem            : [
        {
            Value                : lang,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
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
            Value                : countTexts,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        },
        {
            Value                : skip,
            ![@HTML5.CssDefaults]: {width: '5rem'}
        }
    ],
    Identification      : [{
        $Type : 'UI.DataFieldForAction',
        Action: 'WorkBookService.toggleSkip',
        Label : '{i18n>texts.toggleSkip}'
    }],
    HeaderInfo          : {
        TypeName      : '{i18n>Slovo}',
        TypeNamePlural: '{i18n>Slova}',
        Title         : {Value: morphem},
        // Description   : {Value: count}
        Description   : {Value: {$edmJson: {
            $Apply   : [
                {Path: 'count'},
                ' / ',
                {Path: 'skip'}
            ],
            $Function: 'odata.concat'
        }}}
    },
    HeaderFacets        : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#External',
    }],
    Facets              : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'translations/@UI.LineItem',
            Label : '{i18n>translations}'
        },
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
    ],
    FieldGroup #External: {Data: [{
        Label: '{i18n>definition}',
        Value: definition,
        Url  : definition,
        $Type: 'UI.DataFieldWithUrl'
    }]},
};

annotate WorkBookService.Forms with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Form}',
        TypeNamePlural: '{i18n>Forms}',
        Title         : {Value: form}
    },
    LineItem  : [{Value: form}]
};

annotate WorkBookService.Sentences with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: text},
        Description   : {Value: hash}
    },
    LineItem               : [{Value: text}],
    Facets                 : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'tokens/@UI.LineItem',
    // Label : '{i18n>Tokens}'
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

annotate WorkBookService.Tokens with @UI: {
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

annotate WorkBookService.Translations with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Translation}',
        TypeNamePlural: '{i18n>Translations}',
        Title         : {Value: slovo.morphem},
        // Description   : {Value: slovo.lang}
        Description   : {Value: {$edmJson: {
            $Apply   : [
                {Path: 'slovo/lang'},
                ' -> ',
                {Path: 'lang_code'}
            ],
            $Function: 'odata.concat'
        }}}
    },
    LineItem               : [
        {Value: author_id},
        {Value: lang_code},
        {Value: value}
    ],
    FieldGroup #Translation: {Data: [{Value: value}]},
    Facets                 : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Translation',
        Label : '{i18n>translation}'
    }]
};
