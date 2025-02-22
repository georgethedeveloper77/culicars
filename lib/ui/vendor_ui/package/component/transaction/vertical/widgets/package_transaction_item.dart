import 'package:flutter/material.dart';
import '../../../../../../../config/ps_colors.dart';

import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../core/vendor/viewobject/buyadpost_transaction.dart';

class PackageTransactionItem extends StatefulWidget {
  const PackageTransactionItem({
    Key? key,
    required this.transaction,
    required this.isSelected,
    required this.onLongPress,
    required this.onTap,
  }) : super(key: key);

  final PackageTransaction transaction;
  final bool isSelected;
  final Function onLongPress;
  final Function onTap;

  @override
  State<PackageTransactionItem> createState() => _PackageTransactionItemState();
}

class _PackageTransactionItemState extends State<PackageTransactionItem> {
  @override
  Widget build(BuildContext context) {
    final Widget _dividerWidget = Divider(
      height: 1,
      color: Theme.of(context).iconTheme.color,
    );

    return InkWell(
      onTap: () {
        widget.onTap();
      },
      onLongPress: () {
        setState(() {
          widget.onLongPress();
        });
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.start,
        children: <Widget>[
          Container(
            color: widget.isSelected
                ? Utils.isLightMode(context)
                    ? PsColors.primary50
                    : PsColors.text500
                : PsColors.achromatic50,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.start,
              children: <Widget>[
                if (widget.isSelected)
                  Container(
                    margin: const EdgeInsets.only(left: 16),
                    decoration: BoxDecoration(
                        color: Theme.of(context).primaryColor,
                        borderRadius: BorderRadius.circular(PsDimens.space4)),
                    child: Icon(
                      Icons.check,
                      color: PsColors.achromatic50,
                      size: PsDimens.space20,
                    ),
                  ),
                Expanded(
                  child: Row(
                    //mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: <Widget>[
                      Container(
                        padding: const EdgeInsets.only(
                            left: PsDimens.space16,
                            top: PsDimens.space14,
                            bottom: PsDimens.space14,
                            right: PsDimens.space2),
                        child: Text(
                          'You purchased a',
                          style:
                              Theme.of(context).textTheme.titleSmall!.copyWith(
                                    color: Utils.isLightMode(context)
                                        ? PsColors.text800
                                        : Utils.isLightMode(context)
                                            ? PsColors.achromatic50
                                            : PsColors.achromatic800,
                                    fontWeight: FontWeight.w500,
                                  ),
                        ),
                      ),
                      const SizedBox(
                        width: PsDimens.space4,
                      ),
                      Text(
                          '${widget.transaction.package!.paymentInfo!.value!} Package.',
                          textAlign: TextAlign.start,
                          style:
                              Theme.of(context).textTheme.titleSmall!.copyWith(
                                    color: Theme.of(context).primaryColor,
                                    fontWeight: FontWeight.w500,
                                  )),
                    ],
                  ),
                ),
                Text(widget.transaction.package!.addedDateStr!,
                    textAlign: TextAlign.start,
                    style: Theme.of(context).textTheme.bodySmall!),
                const SizedBox(
                  width: PsDimens.space16,
                ),
              ],
            ),
          ),
          _dividerWidget,
        ],
      ),
    );
  }
}
