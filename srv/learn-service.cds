using {ru.dev4hana.slova as db} from '../db/schema';

@path    : '/learn'
@requires: 'authenticated-user'
service MyService {

    @readonly
    entity Languages as projection on db.Languages;

    @readonly
    entity Slova     as projection on db.Slova;

    entity Translations @(restrict: [{
        grant: [
            'READ',
            'WRITE'
        ],
        to   : 'authenticated-user',
        where: 'author_id = $user'
    }])              as projection on db.Translations;

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
        slovo.morphem || ' (' || slovo.pos || ')'     as what : String,
        slovo.lang || ' -> ' || translation.lang.code as how  : String
    } actions {
        action guessCard(value : String);
    };

}
