annotate UserService.Slova with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updateable: false}
);

annotate UserService.Slova with {
    etymology @(
        ValueList.entity: 'Etymology',
        Common.ValueListWithFixedValues
    )
}

annotate UserService.Slova with @UI: {
    SelectionFields     : [
        lang,
        pos,
        morphem,
        etymology
    ],
    Identification      : [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'UserService.makeCard',
            Label : '{i18n>user.makeCard}'
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'UserService.addTranslation',
            Label : '{i18n>user.addTranslation}'
        }
    ],
    LineItem            : [
        {Value: lang},
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
    HeaderFacets        : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#External',
    }],
    Facets              : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'etymology/@UI.FieldGroup#External',
            Label : '{i18n>etymology}'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'siblings/@UI.LineItem',
            Label : '{i18n>siblings}'
        },
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
    FieldGroup #External: {Data: [
        {
            Label: '{i18n>definition}',
            Value: definition,
            Url  : definition,
            $Type: 'UI.DataFieldWithUrl'
        },
        {
            Label: '{i18n>etymology}',
            Value: etymology_root
        }
    ]},
};

// annotate UserService.Forms with {
//     form @Core.Immutable;
// };

annotate UserService.Forms with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: true},
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate UserService.Forms with @UI: {
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

annotate UserService.Slova.sentences with @UI: {
    HeaderInfo             : {
        TypeName      : '{i18n>Sentence}',
        TypeNamePlural: '{i18n>Sentences}',
        Title         : {Value: sent.text},
        Description   : {Value: sent.hash}
    },
    LineItem               : [{Value: sent.text}],
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
        Value: translation,
        Url  : translation,
        $Type: 'UI.DataFieldWithUrl'
    }]},
};

annotate UserService.Tokens with @UI: {
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

annotate UserService.Etymology with {
    root @(Common: {Text: {
        $value                : root,
        ![@UI.TextArrangement]: #TextOnly
    }})
};

annotate UserService.Etymology with @UI: {
    HeaderInfo          : {
        TypeName      : '{i18n>Etymology}',
        TypeNamePlural: '{i18n>Etymology}',
        Title         : {Value: root},
        Description   : {Value: reference}
    },
    LineItem            : [{Value: root}, ],
    FieldGroup #External: {Data: [{
        Label: '{i18n>reference}',
        Value: reference,
        Url  : reference,
        $Type: 'UI.DataFieldWithUrl'
    }]},
    Facets              : [{
        $Type : 'UI.ReferenceFacet',
        Target: 'slova/@UI.LineItem',
        Label : '{i18n>slova}'
    }]
};

// annotate UserService.Translations with @odata.draft.enabled;

annotate UserService.Translations with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: true},
    Capabilities.UpdateRestrictions: {Updateable: false}
);

annotate UserService.Translations with {
    value @UI.MultiLineText;
}

annotate UserService.Translations with @UI: {
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

annotate UserService.Cards with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Card}',
        TypeNamePlural: '{i18n>Cards}'
    },
    LineItem  : [
        {Value: slovo.morphem},
        {Value: slovo.lang},
        {Value: slovo.pos}
    ]
};

annotate UserService.Skips with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Skip}',
        TypeNamePlural: '{i18n>Skips}'
    },
    LineItem  : [
        {Value: slovo.morphem},
        {Value: slovo.lang},
        {Value: slovo.pos}
    ]
};

annotate UserService.Texts with @UI: {
    HeaderInfo: {
        TypeName      : '{i18n>Text}',
        TypeNamePlural: '{i18n>Texts}'
    },
    LineItem  : [
        {Value: name},
        {Value: lang_code},
        {Value: status}
    ]
};

annotate UserService.Users with {
    defaultLang @(
        ValueList.entity: 'Languages',
        Common.ValueListWithFixedValues
    )
}

annotate UserService.Users with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate UserService.Users with @odata.draft.enabled;

annotate UserService.Users with @UI: {
    LineItem          : [
        {Value: id},
        {Value: name},
        {Value: defaultLang_code}
    ],
    HeaderInfo        : {
        TypeName      : '{i18n>User}',
        TypeNamePlural: '{i18n>Users}',
        Title         : {Value: id},
        Description   : {Value: name}
    },
    HeaderFacets      : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Params',
        Label : '{i18n>Params}'
    }],
    FieldGroup #Params: {Data: [
        // {
        //     Label: '{i18n>name}',
        //     Value: name
        // },
        {
            Label: '{i18n>lang}',
            Value: defaultLang_code
        },
        {
            Label: '{i18n>pos}',
            Value: pos
        }
    ]},
    Facets            : [
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'texts/@UI.LineItem',
            Label : '{i18n>texts}'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'skips/@UI.LineItem',
            Label : '{i18n>skips}'
        },
    // {
    //     $Type : 'UI.ReferenceFacet',
    //     Target: 'translations/@UI.LineItem',
    //     Label : '{i18n>translations}'
    // },
    // {
    //     $Type : 'UI.ReferenceFacet',
    //     Target: 'cards/@UI.LineItem',
    //     Label : '{i18n>cards}'
    // }
    ]
};
