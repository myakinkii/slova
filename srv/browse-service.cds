using {ru.dev4hana.slova as db} from '../db/schema';

@path    : '/browse'
@requires: 'authenticated-user'
service UserService {

    @readonly
    entity Languages as projection on db.Languages;

    @readonly
    entity Slova     as projection on db.Slova actions {
        action makeCard()                     returns Cards;

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

    entity Users @(restrict: [{
        grant: [
            'READ',
            'UPDATE'
        ],
        to   : 'authenticated-user',
        where: 'id = $user'
    }])              as projection on db.Users;

    entity Cards @(restrict: [{
        grant: [
            'READ',
            'WRITE',
            'guessCard'
        ],
        to   : 'authenticated-user',
        where: 'user_id = $user'
    }])              as projection on db.Cards {
        *,
        slovo.morphem || ' (' || slovo.pos || ')'          as what : String,
        slovo.lang || ' -> ' || translation.lang.code as how  : String
    } actions {
        action guessCard(value : String);
    };

}
