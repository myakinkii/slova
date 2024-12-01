using {cc.slova.model as db} from '../db/schema';

@path    : '/texts'
@requires: 'authenticated-user'
service TextsService {

    type TextFilter : {
        ids : many UUID
    }

    @(Common.SideEffects: {TargetEntities: ['/TextsService.EntityContainer/Decks']})
    action createDeck(name : String)                    returns Decks;

    entity Decks @(restrict: [{
        grant: [
            'READ',
            'WRITE',
            'addToParent'
        ],
        to   : 'authenticated-user',
        where: 'createdBy = $user'
    }])                  as projection on db.Decks actions {
        action addToParent( @(
                                title:'{i18n>deck}',
                                Common:{
                                    ValueListWithFixedValues: true,
                                    ValueList               : {
                                        Label         : '{i18n>deck}',
                                        CollectionPath: 'Decks',
                                        Parameters    : [
                                            {
                                                $Type            : 'Common.ValueListParameterInOut',
                                                ValueListProperty: 'ID',
                                                LocalDataProperty: deck
                                            },
                                            {
                                                $Type            : 'Common.ValueListParameterDisplayOnly',
                                                ValueListProperty: 'name'
                                            }
                                        ]
                                    }
                                }
                            ) deck : UUID);
    };

    action resolveDeckFilter(deck : UUID)               returns TextFilter;

    @readonly
    entity DecksFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user'
    }])                  as
        select from db.Decks {
            key ID   as code,
            name as text,
            createdBy,
            1    as count : Integer
        };

    @readonly
    entity PosFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from SlovaDistinct {
            key pos        as code,
            pos        as text,
            createdBy,
            status,
            count( * ) as count : Integer
        }
        group by
            pos;

    @readonly
    entity LangsFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from SlovaDistinct {
            key lang       as code,
            lang       as text,
            createdBy,
            status,
            count( * ) as count : Integer
        }
        group by
            lang;

    @readonly
    entity SlovaDistinct as
        select distinct
            key pos,
            key morphem,
            key lang,
            key createdBy,
            key status
        from Slova
        where
               createdBy = $user
            or status    = 9;

    @readonly
    entity TextsFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from Slova {
            key import.ID   as code,
            import.name as text,
            createdBy,
            status,
            count( * )  as count : Integer
        }
        group by
            import.ID
        order by
            text asc;

    @readonly
    entity AuthorsFilter @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from Texts {
            key createdBy  as code,
            authorName as text,
            createdBy,
            status,
            count( * ) as count : Integer
        }
        group by
            createdBy;

    type Token {
        importId : UUID;
        hash     : String;
        index    : Integer;
        lemma    : String;
        pos      : String;
        feats    : String;
    }

    action syncToken(token : Token);
    action getDefinition(lang : String, lemma : String) returns String;

    @(Common.SideEffects: {TargetEntities: [
        '/TextsService.EntityContainer/Texts',
        '/TextsService.EntityContainer/PosFilter',
        '/TextsService.EntityContainer/LangsFilter',
        '/TextsService.EntityContainer/TextsFilter',
        '/TextsService.EntityContainer/AuthorsFilter'
    ]})
    action createText(input : String)                   returns Texts;

    entity Texts @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user',
            where: 'createdBy = $user or status = 9'
        },
        {
            grant: [
                'WRITE',
                'parseText',
                'generateText',
                'addToDeck'
            ],
            to   : 'authenticated-user',
            where: 'createdBy = $user'
        }
    ])                   as
        select from db.Import
        mixin {
            author : Association to db.Users
                         on author.id = createdBy
        }
        into {
            *,
            case
                when
                    author.name is null
                then
                    author.id
                else
                    author.name
            end as authorName : String
        }
        order by
            Import.name asc
        actions {

            @(
                cds.odata.bindingparameter.name: '_it',
                Common.SideEffects             : {
                    TargetEntities  : [
                        '_it/sentences',
                        '_it/words'
                    ],
                    TargetProperties: [
                        '_it/text',
                        '_it/input'
                    ]
                }
            )
            action parseText();

            @(
                cds.odata.bindingparameter.name: '_it',
                Common.SideEffects             : {TargetProperties: ['_it/input']}
            )
            action generateText();

            action addToDeck( @(
                                  title:'{i18n>deck}',
                                  Common:{
                                      ValueListWithFixedValues: true,
                                      ValueList               : {
                                          Label         : '{i18n>deck}',
                                          CollectionPath: 'Decks',
                                          Parameters    : [
                                              {
                                                  $Type            : 'Common.ValueListParameterInOut',
                                                  ValueListProperty: 'ID',
                                                  LocalDataProperty: deck
                                              },
                                              {
                                                  $Type            : 'Common.ValueListParameterDisplayOnly',
                                                  ValueListProperty: 'name'
                                              }
                                          ]
                                      }
                                  }
                              ) deck : UUID);
        };

    @readonly
    entity Sentences @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as projection on db.ImportSentences {
        *,
        import.createdBy,
        import.status
    } order by
        index asc;

    @readonly
    entity Slova @(restrict: [{
        grant: [
            'READ',
            'toggleSkip'
        ],
        to   : 'authenticated-user',
        where: 'createdBy = $user or status = 9'
    }])                  as
        select from db.ImportWords
        mixin {
            skip : Association to db.Skips
                       on  skip.slovo.morphem = morphem
                       and skip.slovo.lang    = lang
                       and skip.slovo.pos     = pos
                       and skip.user.id       = $user
        }
        into {
            *,
            import.createdBy,
            import.status,
            import.name as textName,
            ''          as definition : String,
            case
                when
                    skip.user.id is null
                then
                    false
                else
                    true
            end         as skip       : Boolean
        } actions {
            @(Common.SideEffects: {TargetEntities: ['/TextsService.EntityContainer/Slova']})
            action toggleSkip() returns Boolean;
        };

    @readonly
    entity Forms         as projection on db.ImportForms;

    @readonly
    entity PartsOfSpeech as projection on db.PartsOfSpeech;

    @readonly
    entity Cases         as projection on db.Cases;

    @readonly
    entity Genders       as projection on db.Genders;

    @readonly
    entity Numbers       as projection on db.Numbers;

    @readonly
    entity Persons       as projection on db.Persons;

    @readonly
    entity Tenses        as projection on db.Tenses;

    @readonly
    entity Aspects       as projection on db.Aspects;

    @readonly
    entity Moods         as projection on db.Moods;

    @readonly
    entity Voices        as projection on db.Voices;

    @readonly
    entity Degrees       as projection on db.Degrees;

    @readonly
    entity VerbForms     as projection on db.VerbForms;

    @readonly
    entity Languages     as projection on db.Languages;

    @readonly
    entity TextTypes     as projection on db.TextTypes;

    @readonly
    entity TextSizes     as projection on db.TextSizes;

    @readonly
    entity TextLocations as projection on db.TextLocations;

    @readonly
    entity TextModifiers as projection on db.TextModifiers;

    @odata.singleton
    entity Profile       as
        select from db.Users
        where
            id = $user;
}
