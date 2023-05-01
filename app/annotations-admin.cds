annotate AdminService.Slova with @odata.draft.enabled;

annotate AdminService.Slova with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate AdminService.Slova with {
    etymology @(
        ValueList.entity: 'Etymology',
        Common.ValueListWithFixedValues
    )
}

annotate AdminService.Slova with @UI: {
    SelectionFields     : [
        lang,
        pos,
        morphem,
        etymology
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

// annotate AdminService.Forms with {
//     form @Core.Immutable;
// };

annotate AdminService.Forms with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: true},
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate AdminService.Forms with @UI: {
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


annotate AdminService.Etymology with @odata.draft.enabled;

annotate AdminService.Etymology with {
    root @(Common: {Text: {
        $value                : ascii,
        ![@UI.TextArrangement]: #TextFirst
    }})
};

annotate AdminService.Etymology with @(
    Capabilities.DeleteRestrictions: {Deletable: false},
    Capabilities.InsertRestrictions: {Insertable: true, RequiredProperties: ['ascii']},
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate AdminService.Etymology with @UI: {
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
// Facets              : [{
//     $Type : 'UI.ReferenceFacet',
//     Target: 'slova/@UI.LineItem',
//     Label : '{i18n>slova}',
//     ![@UI.Hidden]: HasDraftEntity
// }]
};

annotate AdminService.Translations with @odata.draft.enabled;

annotate AdminService.Translations with @(
    Capabilities.DeleteRestrictions: {Deletable: true},
    Capabilities.InsertRestrictions: {Insertable: false},
    Capabilities.UpdateRestrictions: {Updateable: true}
);

annotate AdminService.Translations with {
    value @UI.MultiLineText;
}

annotate AdminService.Translations with @UI: {
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
