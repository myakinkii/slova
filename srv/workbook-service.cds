using {cc.slova.model as db} from '../db/schema';

@path    : '/workbook'
@requires: ['authenticated-user']
service WorkBookService {

    @readonly
    entity PosFilter as select from Slova {
        owner,
        pos as code,
        count(*) as count:Integer
    } group by owner, pos;

    @readonly
    entity LangsFilter as select from Slova {
        owner,
        lang as code,
        count(*) as count:Integer
    } group by owner, lang;

    @readonly
    entity Slova @(restrict: [{
        grant: ['READ'],
        to   : 'authenticated-user',
        where: 'owner = $user'
    }])                                 as
        select from Workbook
        mixin {
            translations : Association to many db.Translations
                               on  translations.slovo.morphem = morphem
                               and translations.slovo.lang    = lang
                               and translations.slovo.pos     = pos
        }
        into {
            *,
            translations
        };

    @readonly
    entity Forms                        as projection on WorkbookForms;

    @readonly
    entity Sentences                    as projection on WorkbookWordsWithSentencesTokens;

    @readonly
    entity Tokens                       as projection on WorkbookTokens;

    @readonly
    entity Translations                 as projection on db.Translations;
}

entity Workbook                         as
    select from WorkbookWords
    mixin {
        sentences : Association to many WorkbookWordsWithSentencesTokens
                        on  sentences.owner   = owner
                        and sentences.morphem = morphem
                        and sentences.lang    = lang
                        and sentences.pos     = pos;
        forms     : Association to many WorkbookForms
                        on  forms.owner   = owner
                        and forms.morphem = morphem
                        and forms.lang    = lang
                        and forms.pos     = pos;
    }
    into {
        key owner,
        key morphem,
        key lang,
        key pos,
            count,
            forms,
            sentences
    };

entity WorkbookWords                    as
    select from db.ImportWords {
        key import.createdBy as owner,
        key morphem,
        key lang,
        key pos,
            sum(count)       as count : Integer
    }
    group by
        import.createdBy,
        morphem,
        lang,
        pos;

entity WorkbookWordsWithSentencesTokens as
    select from WorkbookWordsToSentences
    mixin {
        tokens : Association to many WorkbookTokens
                     on tokens.hash = hash
    }
    into {
        key owner,
        key morphem,
        key lang,
        key pos,
        key hash,
            text,
            count,
            tokens
    };

entity WorkbookWordsToSentences         as
    select from db.ImportWords {
        key import.createdBy as owner,
        key morphem,
        key lang,
        key pos,
        key sentences.sent.hash,
            sentences.sent.text,
            count( * )       as count : Integer
    }
    group by
        import.createdBy,
        morphem,
        lang,
        pos,
        sentences.sent.hash,
        sentences.sent.text;

entity WorkbookTokens                   as
    select from db.ImportSentences {
        key import.createdBy as owner,
        key hash,
        key tokens.index,
            tokens.form,
            tokens.pos,
            tokens.lemma
    };

entity WorkbookForms                    as
    select from db.ImportForms {
        key lemma.import.createdBy as owner,
        key lemma.morphem          as morphem,
        key lemma.lang             as lang,
        key lemma.pos              as pos,
        key form,
            count( * )             as count : Integer
    }
    group by
        lemma.import.createdBy,
        lemma.morphem,
        lemma.lang,
        lemma.pos,
        form;
