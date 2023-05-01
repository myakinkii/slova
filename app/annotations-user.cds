
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
        {Value: defaultLang_code}
    ],
    HeaderInfo        : {
        TypeName      : '{i18n>User}',
        TypeNamePlural: '{i18n>Users}',
        Title         : {Value: id},
        Description   : {Value: defaultLang.name}
    },
    HeaderFacets      : [{
        $Type : 'UI.ReferenceFacet',
        Target: '@UI.FieldGroup#Params',
    }],
    FieldGroup #Params: {Data: [
        {
            Label: '{i18n>name}',
            Value: name
        },
        {
            Label: '{i18n>lang}',
            Value: defaultLang_code
        }
    ]}
};
