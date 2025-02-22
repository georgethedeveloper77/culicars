import 'package:flutter/material.dart';

import '../../../../config/ps_colors.dart';
import '../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../core/vendor/utils/utils.dart';
import '../ps_button_widget_with_round_corner.dart';

class EmailSentWarningDialog extends StatefulWidget {
  const EmailSentWarningDialog({this.message, this.onPressed});

  final String? message;
  final Function? onPressed;
  @override
  _WarningDialogState createState() => _WarningDialogState();
}

class _WarningDialogState extends State<EmailSentWarningDialog> {
  @override
  Widget build(BuildContext context) {
    return _NewDialog(widget: widget);
  }
}

class _NewDialog extends StatelessWidget {
  const _NewDialog({
    Key? key,
    required this.widget,
  }) : super(key: key);

  final EmailSentWarningDialog widget;

  @override
  Widget build(BuildContext context) {
    final Widget _headerWidget = Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: <Widget>[
        Expanded(
          child: Row(
            children: <Widget>[
              Icon(
                Icons.warning_amber_outlined,
                color: PsColors.warning500,
              ),
              const SizedBox(
                width: PsDimens.space12,
              ),
              Text(
                'register__email_sent'.tr,
                textAlign: TextAlign.start,
                style: TextStyle(
                    color: Utils.isLightMode(context)
                        ? PsColors.text800
                        : PsColors.text50,
                    fontSize: 18,
                    fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        // InkWell(
        //     onTap: () {
        //       Navigator.pop(context);
        //     },
        //     child: Icon(
        //       Icons.close,
        //       color: Utils.isLightMode(context)
        //           ? PsColors.text800
        //           : PsColors.text50,
        //     ))
      ],
    );
    return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
        child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _headerWidget,
                  Container(
                    padding: const EdgeInsets.only(
                        top: PsDimens.space16, bottom: PsDimens.space24),
                    child: Text(
                      widget.message!,
                      maxLines: 4,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium!.copyWith(
                            fontWeight: FontWeight.w400,
                          ),
                    ),
                  ),
                  PSButtonWidgetRoundCorner(
                      colorData: Theme.of(context).primaryColor,
                      hasShadow: false,
                      width: MediaQuery.of(context).size.width,
                      height: 40,
                      titleText: 'email_verificatiion_title'.tr,
                      onPressed: () {
                        widget.onPressed!();
                      }),
                ],
              ),
            )));
  }
}
