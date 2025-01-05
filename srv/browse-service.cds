using {cc.slova.model as db} from '../db/schema';

@path    : '/browse'
@requires: 'authenticated-user'
service UserService {

    @readonly
    entity Languages as projection on db.Languages;

    @readonly
    entity Slova     as projection on db.Slova actions {
        action makeCard();

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetEntities: ['_it/translations']}
        )
        action addTranslation(value : String) returns Translations;
    };

    @readonly
    entity Forms     as projection on db.Forms;

    @readonly
    entity Etymology as projection on db.Etymology;

    @readonly
    entity Sentences as projection on db.Sentences;

    @readonly
    entity Tokens    as projection on db.Tokens;

    entity Translations @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user'
        },
        {
            grant: ['WRITE'],
            to   : 'authenticated-user',
            where: 'author_id = $user'
        }
    ])               as projection on db.Translations;

    entity Cards @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user'
        },
        {
            grant: ['WRITE'],
            to   : 'authenticated-user',
            where: 'user_id = $user'
        }
    ])               as projection on db.Cards;

    entity Skips @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user'
        },
        {
            grant: ['WRITE'],
            to   : 'authenticated-user',
            where: 'user_id = $user'
        }
    ])               as select from db.Skips mixin {
            words : Association to many Words
                       on  words.morphem    = $self._slovo_morphem
                       and words.lang       = $self._slovo_lang
                       and words.pos        = $self._slovo_pos
                       and words.createdBy  = $self.user.id
        } into {
            *,
            slovo.morphem as _slovo_morphem,
            slovo.lang as _slovo_lang,
            slovo.pos as _slovo_pos,
            words
        };

    @readonly
    entity Texts @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user'
        },
        {
            grant: ['WRITE'],
            to   : 'authenticated-user',
            where: 'createdBy = $user'
        }
    ])               as projection on db.Import;

    @readonly
    entity Words @(restrict: [
        {
            grant: ['READ'],
            to   : 'authenticated-user'
        },
        {
            grant: ['WRITE'],
            to   : 'authenticated-user',
            where: 'createdBy = $user'
        }
    ])               as projection on db.ImportWords {
        *,
        import.createdBy as createdBy,
        import.createdAt as createdAt,
        import.name as textName
    };

    entity Users @(restrict: [
        {
            grant: [
                'READ',
                'UPDATE'
            ],
            to   : 'authenticated-user',
            where: 'id = $user'
        },
        {
            grant: '*',
            to   : 'admin-user'
        }
    ])               as
        select from db.Users
        mixin {
            skips : Association to many Skips
                        on skips.user.id = id;
            texts : Association to many Texts
                        on texts.createdBy = id;
        }
        into {
            *,
            texts,
            skips,
            translations,
            cards
        };

}
